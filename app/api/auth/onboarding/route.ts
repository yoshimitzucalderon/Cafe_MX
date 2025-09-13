import { NextRequest, NextResponse } from 'next/server';
import { onboardingService } from '../../../../lib/auth/onboarding-service';
import { getUserSupabase } from '../../../../lib/supabase/tenant-client';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/auth/onboarding - Request received');

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

    const supabase = getUserSupabase();
    console.log('🔗 Supabase client initialized');

    // Get user from token
    console.log('👤 Getting user from token...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!user) {
      console.log('❌ No user found');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
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

    // Complete onboarding
    console.log('⚡ Calling onboardingService.completeOnboarding...');
    const result = await onboardingService.completeOnboarding({
      userId: user.id,
      email: user.email!,
      fullName: fullName,
      businessName: businessName,
      phone: phone,
      plan: 'basic'
    });

    console.log('📤 Onboarding service result:', {
      success: result.success,
      hasClient: !!result.client,
      error: result.error
    });

    if (!result.success || !result.client) {
      console.log('❌ Onboarding failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Error al crear la cafetería' },
        { status: 500 }
      );
    }

    console.log('✅ Onboarding completed successfully for:', result.client.slug);

    return NextResponse.json({
      success: true,
      client: result.client
    });

  } catch (error) {
    console.error('🚨 API Onboarding error:', error);
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
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { needsOnboarding: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getUserSupabase();

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { needsOnboarding: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user needs onboarding
    const needsOnboarding = await onboardingService.needsOnboarding(user.id);

    return NextResponse.json({
      needsOnboarding,
      userId: user.id
    });

  } catch (error) {
    console.error('🚨 API Onboarding check error:', error);
    return NextResponse.json(
      {
        needsOnboarding: false,
        error: error instanceof Error ? error.message : 'Error checking onboarding status'
      },
      { status: 500 }
    );
  }
}