import { NextRequest, NextResponse } from 'next/server';
import { processTicketOCRWithRetry } from '../../../../lib/ocr-service';
import { getClientSupabase, validateClientAccess } from '../../../../lib/supabase/tenant-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 OCR API endpoint called');
    
    const { imageUrl, cafeteriaSlug } = await request.json();
    
    if (!imageUrl || !cafeteriaSlug) {
      console.error('❌ Missing required fields:', { imageUrl: !!imageUrl, cafeteriaSlug: !!cafeteriaSlug });
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl and cafeteriaSlug' }, 
        { status: 400 }
      );
    }

    console.log(`🏢 Processing OCR for client: ${cafeteriaSlug}`);

    const authHeader = request.headers.get('authorization');
    const tenantSlug = request.headers.get('x-tenant-slug') || cafeteriaSlug;
    
    const { isValid, userId, userRole, schemaName, error } = await validateClientAccess(
      authHeader,
      tenantSlug,
      'empleado'
    );

    if (!isValid || !schemaName) {
      console.error('❌ Access validation failed:', error);
      return NextResponse.json(
        { error: error || 'Access denied' }, 
        { status: 403 }
      );
    }

    console.log(`✅ Access validated for user ${userId} with role ${userRole} in schema ${schemaName}`);

    console.log(`🔍 Starting OCR processing for image: ${imageUrl}`);
    const ocrResult = await processTicketOCRWithRetry(imageUrl);
    console.log(`✅ OCR completed with confidence: ${ocrResult.confidence}`);

    const clientSupabase = getClientSupabase(schemaName);
    
    const ticketData = {
      image_url: imageUrl,
      image_path: null,
      fecha_ticket: ocrResult.fecha,
      total: ocrResult.total,
      subtotal: ocrResult.subtotal,
      iva: ocrResult.iva,
      rfc_emisor: ocrResult.rfc_emisor,
      nombre_emisor: ocrResult.nombre_emisor,
      concepto: ocrResult.concepto,
      categoria: ocrResult.categoria,
      status: ocrResult.confidence >= 0.8 ? 'processed' : 'review_needed',
      ocr_confidence: ocrResult.confidence,
      api_provider: ocrResult.api_provider,
      processing_time_ms: ocrResult.processing_time_ms,
      raw_ocr_response: ocrResult.raw_response,
      validation_errors: ocrResult.validation_errors.length > 0 ? ocrResult.validation_errors : null,
      created_by: userId
    };

    console.log('💾 Saving ticket to database...');
    const { data: ticket, error: dbError } = await clientSupabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save ticket data', details: dbError.message }, 
        { status: 500 }
      );
    }

    console.log(`✅ Ticket saved successfully with ID: ${ticket.id}`);

    await updateOCRUsageStats(schemaName, ocrResult);

    const responseData = {
      success: true,
      ticket_id: ticket.id,
      ocr_result: {
        fecha: ocrResult.fecha,
        total: ocrResult.total,
        subtotal: ocrResult.subtotal,
        iva: ocrResult.iva,
        rfc_emisor: ocrResult.rfc_emisor,
        nombre_emisor: ocrResult.nombre_emisor,
        concepto: ocrResult.concepto,
        categoria: ocrResult.categoria,
        confidence: ocrResult.confidence,
        processing_time_ms: ocrResult.processing_time_ms,
        validation_errors: ocrResult.validation_errors
      },
      needs_review: ocrResult.confidence < 0.8,
      status: ticketData.status
    };

    console.log('✅ OCR API completed successfully');
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('❌ OCR API Error:', error);
    return NextResponse.json(
      { 
        error: 'OCR processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

async function updateOCRUsageStats(schemaName: string, ocrResult: any): Promise<void> {
  try {
    const { supabaseAdmin } = await import('../../../../lib/supabase/tenant-client');
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const costPerRequest = 0.003;

    if (!supabaseAdmin) {
      console.warn('❌ Supabase admin client not available, skipping OCR usage stats');
      return;
    }

    const { data: cliente } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('schema_name', schemaName)
      .single();

    if (!cliente) {
      console.warn('❌ Client not found for schema:', schemaName);
      return;
    }

    const { data: existing } = await supabaseAdmin
      .from('ocr_usage')
      .select('*')
      .eq('cliente_id', cliente.id)
      .eq('mes', monthStart.toISOString().split('T')[0])
      .eq('api_provider', ocrResult.api_provider)
      .single();

    if (existing) {
      const { error } = await supabaseAdmin
        .from('ocr_usage')
        .update({
          total_requests: existing.total_requests + 1,
          successful_requests: existing.successful_requests + (ocrResult.confidence > 0 ? 1 : 0),
          failed_requests: existing.failed_requests + (ocrResult.confidence === 0 ? 1 : 0),
          total_cost_usd: existing.total_cost_usd + costPerRequest,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error('❌ Error updating OCR usage stats:', error);
      }
    } else {
      const { error } = await supabaseAdmin
        .from('ocr_usage')
        .insert({
          cliente_id: cliente.id,
          mes: monthStart.toISOString().split('T')[0],
          total_requests: 1,
          successful_requests: ocrResult.confidence > 0 ? 1 : 0,
          failed_requests: ocrResult.confidence === 0 ? 1 : 0,
          total_cost_usd: costPerRequest,
          api_provider: ocrResult.api_provider
        });

      if (error) {
        console.error('❌ Error creating OCR usage stats:', error);
      }
    }
  } catch (error) {
    console.error('❌ Error in updateOCRUsageStats:', error);
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'OCR API is running',
    version: '2.0.0',
    provider: process.env.OCR_PRIMARY_PROVIDER || 'anthropic',
    status: 'healthy'
  });
}