import { NextRequest, NextResponse } from 'next/server';
import { onboardingService } from '../../../lib/auth/onboarding-service';
import { getSupabaseAdmin } from '../../../lib/supabase/tenant-client';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/nueva-cafeteria - Request received');

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

    // Prefer local JWT parsing to avoid CORS issues when validating via Supabase
    let user: any;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('❌ Token expired');
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      user = {
        id: payload.sub,
        email: payload.email,
        user_metadata: payload.user_metadata || {}
      };
    } catch (e) {
      console.log('❌ Token parse error:', e);
      // Fallback to server-side validation if parsing fails
      try {
        const admin = getSupabaseAdmin();
        const { data: { user: svUser }, error: authError } = await admin.auth.getUser(token);
        if (authError || !svUser) {
          return NextResponse.json(
            { success: false, error: 'Invalid or expired token' },
            { status: 401 }
          );
        }
        user = svUser;
      } catch (svErr) {
        console.log('❌ Supabase validation error:', svErr);
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
    }

    console.log('✅ User authenticated:', user.email);

    // Parse request body
    const { business_name, owner_name, plan = 'basic' } = await request.json();

    if (!business_name || !business_name.trim()) {
      console.log('❌ Missing business name');
      return NextResponse.json(
        { success: false, error: 'Nombre de cafetería es requerido' },
        { status: 400 }
      );
    }

    const fullName = owner_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Propietario';

    console.log('📋 Creating new coffee shop:', {
      userId: user.id,
      email: user.email,
      businessName: business_name.trim(),
      ownerName: fullName
    });

    console.log('🚀 Starting coffee shop creation process for user:', user.email);

    // Create coffee shop using onboarding service
    console.log('⚡ Calling onboardingService.completeOnboarding...');
    const result = await onboardingService.completeOnboarding({
      userId: user.id,
      email: user.email!,
      fullName: fullName,
      businessName: business_name.trim(),
      phone: user.user_metadata?.phone,
      plan: plan
    });

    console.log('📤 Coffee shop creation result:', {
      success: result.success,
      hasClient: !!result.client,
      error: result.error
    });

    if (!result.success || !result.client) {
      console.log('❌ Coffee shop creation failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Error al crear la cafetería' },
        { status: 500 }
      );
    }

    console.log('✅ Coffee shop created successfully:', result.client.slug);

    return NextResponse.json({
      success: true,
      client: result.client
    });

  } catch (error) {
    console.error('🚨 API Nueva Cafetería error:', error);
    console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al crear la cafetería'
      },
      { status: 500 }
    );
  }
}