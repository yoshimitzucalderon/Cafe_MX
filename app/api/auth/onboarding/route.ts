import { NextRequest, NextResponse } from 'next/server';
import { mockDB, parseJWT, generateUniqueSlug } from '../../../../lib/mock-database';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/auth/onboarding - Request received (LOCAL DEV MODE)');

    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🎫 Token extracted, length:', token.length);

    // Parse and validate JWT token
    let user;
    try {
      const payload = parseJWT(token);
      console.log('🔍 JWT payload parsed successfully, user_id:', payload.sub);

      // Basic validation: check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('❌ Token expired');
        return NextResponse.json(
          { success: false, error: 'Token expired' },
          { status: 401 }
        );
      }

      user = {
        id: payload.sub,
        email: payload.email,
        user_metadata: payload.user_metadata || {},
        created_at: new Date().toISOString()
      };

    } catch (error) {
      console.log('❌ Token parsing error:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Get business data from user metadata
    const businessName = user.user_metadata?.business_name;
    const fullName = user.user_metadata?.full_name;
    const phone = user.user_metadata?.phone;

    console.log('📋 User metadata:', {
      businessName: !!businessName,
      fullName: !!fullName,
      phone: !!phone
    });

    if (!businessName || !fullName) {
      console.log('❌ Missing required metadata');
      return NextResponse.json(
        { success: false, error: 'Información de registro incompleta. Por favor, contacta soporte.' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting onboarding process for user:', user.email);

    // Generate unique slug
    const slug = generateUniqueSlug(businessName);

    console.log('✅ Generated unique slug:', slug);

    // Create mock client
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const schemaName = `cliente_${slug.replace(/-/g, '_')}`;

    const mockClient = {
      id: clientId,
      nombre_negocio: businessName,
      slug: slug,
      schema_name: schemaName,
      owner_email: user.email,
      owner_user_id: user.id,
      rfc: null,
      plan: 'basic',
      activo: true,
      features: {
        ocr_processing: true,
        basic_pos: true,
        inventory_management: true,
        basic_reports: true
      },
      max_usuarios: 5,
      max_tickets_mes: 500,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    // Store in mock database
    mockDB.setClient(slug, mockClient);

    // Also create user-client relationship
    const userClientKey = `${user.id}_${clientId}`;
    mockDB.setUserClient(userClientKey, {
      user_id: user.id,
      cliente_id: clientId,
      slug: slug,
      schema_name: schemaName,
      rol: 'owner',
      activo: true,
      created_at: new Date().toISOString()
    });

    console.log('✅ Mock client created successfully:', slug);

    const dashboardUrl = `/${slug}/dashboard`;

    return NextResponse.json({
      success: true,
      client: {
        id: mockClient.id,
        nombre_negocio: mockClient.nombre_negocio,
        slug: mockClient.slug,
        schema_name: mockClient.schema_name,
        dashboard_url: dashboardUrl
      }
    });

  } catch (error) {
    console.error('🚨 API Onboarding error (LOCAL DEV MODE):', error);
    console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido durante la configuración'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/auth/onboarding - Checking needs (LOCAL DEV MODE)');

    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🚨 /api/auth/onboarding: No auth header, user needs login');
      return NextResponse.json(
        { needsOnboarding: false },
        { status: 200 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Parse JWT token
    let user;
    try {
      const payload = parseJWT(token);
      user = { id: payload.sub, email: payload.email };
    } catch (error) {
      console.log('🚨 /api/auth/onboarding: Invalid token, user needs login');
      return NextResponse.json(
        { needsOnboarding: false },
        { status: 200 }
      );
    }

    // Check if user has any clients in mock database
    const needsOnboarding = !mockDB.hasClients(user.id);

    console.log('✅ Onboarding check result:', { needsOnboarding, userId: user.id });

    return NextResponse.json({
      needsOnboarding,
      userId: user.id
    });

  } catch (error) {
    console.error('🚨 API Onboarding check error (LOCAL DEV MODE):', error);
    return NextResponse.json(
      {
        needsOnboarding: false,
        error: error instanceof Error ? error.message : 'Error checking onboarding status'
      },
      { status: 500 }
    );
  }
}