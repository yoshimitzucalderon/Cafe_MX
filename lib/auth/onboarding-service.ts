import { createTenantClient, getSupabaseAdmin, getClientBySlug } from '../supabase/tenant-client';
import { slugify } from '../utils';

export interface OnboardingData {
  // User data (from auth)
  userId: string;
  email: string;
  fullName: string;

  // Business data
  businessName: string;
  phone?: string;
  rfc?: string;

  // Generated data
  slug?: string;
  plan?: string;
}

export interface OnboardingResult {
  success: boolean;
  client?: {
    id: string;
    nombre_negocio: string;
    slug: string;
    schema_name: string;
    dashboard_url: string;
  };
  error?: string;
}

class OnboardingService {
  
  /**
   * Complete onboarding process for new user
   * 1. Generate unique slug from business name
   * 2. Create client record with schema
   * 3. Set up tenant database schema
   * 4. Associate user with client
   */
  async completeOnboarding(data: OnboardingData): Promise<OnboardingResult> {
    try {
      console.log('🚀 Starting onboarding for:', data.businessName);
      console.log('📋 Onboarding data:', {
        userId: data.userId,
        email: data.email,
        businessName: data.businessName,
        hasPhone: !!data.phone,
        hasRFC: !!data.rfc,
        plan: data.plan || 'basic'
      });

      // Step 1: Generate unique slug
      console.log('🔤 Generating unique slug...');
      const slug = await this.generateUniqueSlug(data.businessName);
      if (!slug) {
        console.log('❌ Failed to generate unique slug');
        return { success: false, error: 'No se pudo generar un identificador único para la cafetería' };
      }
      console.log('✅ Generated slug:', slug);

      // Step 2: Create tenant client
      console.log(`📝 Creating tenant client with slug: ${slug}`);
      const result = await createTenantClient({
        nombre_negocio: data.businessName,
        slug: slug,
        owner_email: data.email,
        owner_user_id: data.userId,
        rfc: data.rfc,
        plan: data.plan || 'basic'
      });

      console.log('📤 CreateTenantClient result:', {
        success: result.success,
        hasClient: !!result.client,
        error: result.error
      });

      if (!result.success || !result.client) {
        console.log('❌ Failed to create tenant client:', result.error);
        return {
          success: false,
          error: result.error || 'Error al crear la cafetería en el sistema'
        };
      }

      // Step 3: Setup initial data (if needed)
      console.log('🔧 Setting up initial tenant data...');
      await this.setupInitialTenantData(result.client.schema_name);

      console.log('✅ Onboarding completed successfully for:', slug);

      const dashboardUrl = this.getDashboardUrl(slug);
      console.log('🔗 Dashboard URL:', dashboardUrl);

      return {
        success: true,
        client: {
          id: result.client.id,
          nombre_negocio: result.client.nombre_negocio,
          slug: result.client.slug,
          schema_name: result.client.schema_name,
          dashboard_url: dashboardUrl
        }
      };

    } catch (error) {
      console.error('🚨 Onboarding error:', error);
      console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido durante el registro'
      };
    }
  }

  /**
   * Generate a unique slug for the business
   */
  private async generateUniqueSlug(businessName: string): Promise<string | null> {
    const baseSlug = slugify(businessName);
    
    if (!baseSlug) {
      return null;
    }

    // Check if base slug is available
    let existingClient = await getClientBySlug(baseSlug);
    if (!existingClient) {
      return baseSlug;
    }

    // Try with numbers appended
    for (let i = 2; i <= 100; i++) {
      const candidateSlug = `${baseSlug}-${i}`;
      existingClient = await getClientBySlug(candidateSlug);
      
      if (!existingClient) {
        return candidateSlug;
      }
    }

    // If we get here, something is wrong
    console.error('🚨 Could not generate unique slug for:', businessName);
    return null;
  }

  /**
   * Setup initial data for new tenant
   */
  private async setupInitialTenantData(schemaName: string): Promise<void> {
    try {
      console.log(`🔧 Setting up initial data for schema: ${schemaName}`);
      
      // TODO: Add initial data setup here
      // For example:
      // - Default product categories
      // - Sample products
      // - Initial settings
      // - Welcome tickets/notifications

      // For now, just log that the setup would happen here
      console.log('✅ Initial tenant data setup completed');

    } catch (error) {
      console.error('🚨 Error setting up initial tenant data:', error);
      // Don't throw here - onboarding can continue even if initial data setup fails
    }
  }

  /**
   * Get dashboard URL for client
   */
  private getDashboardUrl(slug: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ycm360.com';
    
    // For local development
    if (baseUrl.includes('localhost')) {
      return `http://${slug}.localhost:3000/dashboard`;
    }
    
    // For production
    return `https://${slug}.ycm360.com/dashboard`;
  }

  /**
   * Check if user already has any clients
   */
  async getUserClientCount(userId: string): Promise<number> {
    try {
      const admin = getSupabaseAdmin();

      const { data, error } = await admin
        .from('clientes_usuarios')
        .select('cliente_id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('activo', true);

      if (error) {
        console.error('🚨 Error getting user client count:', error);
        return 0;
      }

      return data?.length || 0;

    } catch (error) {
      console.error('🚨 Exception getting user client count:', error);
      return 0;
    }
  }

  /**
   * Check if this is the user's first login and they need onboarding
   */
  async needsOnboarding(userId: string): Promise<boolean> {
    const clientCount = await this.getUserClientCount(userId);
    return clientCount === 0;
  }

  /**
   * Validate business name for slug generation
   */
  validateBusinessName(businessName: string): { valid: boolean; error?: string } {
    if (!businessName || businessName.trim().length === 0) {
      return { valid: false, error: 'El nombre de la cafetería es obligatorio' };
    }

    if (businessName.trim().length < 3) {
      return { valid: false, error: 'El nombre debe tener al menos 3 caracteres' };
    }

    if (businessName.trim().length > 50) {
      return { valid: false, error: 'El nombre no puede tener más de 50 caracteres' };
    }

    // Check for valid characters
    const validNameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s0-9\-&.]+$/;
    if (!validNameRegex.test(businessName.trim())) {
      return { valid: false, error: 'El nombre contiene caracteres no válidos' };
    }

    return { valid: true };
  }

  /**
   * Validate RFC (optional but if provided, must be valid)
   */
  validateRFC(rfc?: string): { valid: boolean; error?: string } {
    if (!rfc || rfc.trim().length === 0) {
      return { valid: true }; // RFC is optional
    }

    // Use the RFC validation from utils
    const { validateRFC } = require('../utils');
    
    if (!validateRFC(rfc.trim())) {
      return { valid: false, error: 'El RFC no tiene un formato válido' };
    }

    return { valid: true };
  }
}

export const onboardingService = new OnboardingService();