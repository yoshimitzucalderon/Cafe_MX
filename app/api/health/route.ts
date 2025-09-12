import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/tenant-client';

export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'checking',
        ocr: 'checking',
        auth: 'checking'
      }
    };

    // Test database connection
    try {
      const { data: dbTest, error: dbError } = await supabaseAdmin
        .from('system_config')
        .select('clave')
        .limit(1);
      
      healthCheck.services.database = dbError ? 'unhealthy' : 'healthy';
    } catch (error) {
      healthCheck.services.database = 'unhealthy';
    }

    // Test OCR service (check if API key is configured)
    healthCheck.services.ocr = process.env.ANTHROPIC_API_KEY ? 'healthy' : 'unhealthy';

    // Test auth service
    try {
      const { data: authTest, error: authError } = await supabaseAdmin.auth.getSession();
      healthCheck.services.auth = 'healthy'; // Auth service is available
    } catch (error) {
      healthCheck.services.auth = 'unhealthy';
    }

    // Overall status
    const allHealthy = Object.values(healthCheck.services).every(status => status === 'healthy');
    healthCheck.status = allHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(healthCheck, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      version: '2.0.0'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}