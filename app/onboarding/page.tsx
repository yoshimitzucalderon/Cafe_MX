'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, Building2, CheckCircle, AlertCircle, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { useOnboarding } from '../../lib/hooks/useOnboarding';

export default function OnboardingPage() {
  const [success, setSuccess] = useState(false);
  const [createdClient, setCreatedClient] = useState<any>(null);
  const [redirecting, setRedirecting] = useState(false);

  const { user, session, loading } = useAuth();
  const { isLoading, error, completeOnboarding, checkNeedsOnboarding } = useOnboarding();
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    console.log('🔍 ONBOARDING AUTH CHECK:', { loading, hasUser: !!user });
    if (!loading && !user) {
      console.log('🚨 ONBOARDING: No user, redirecting to login');
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Check if user already has clients (shouldn't be here)
  useEffect(() => {
    const checkExistingClients = async () => {
      if (!user) return;

      console.log('🔍 ONBOARDING: Checking if user already has clients...');
      try {
        const result = await checkNeedsOnboarding();
        if (!result.needsOnboarding && !result.error && !redirecting) {
          console.log('✅ ONBOARDING: User already has clients, redirecting to dashboard');
          setRedirecting(true);
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    if (user) {
      checkExistingClients();
    }
  }, [user, router, checkNeedsOnboarding]);

  const handleCompleteOnboarding = async () => {
    if (!user || !session?.access_token) return;

    console.log('🚀 Starting onboarding process for user:', user.email);

    // Get business data from user metadata
    const businessName = user.user_metadata?.business_name;
    const fullName = user.user_metadata?.full_name;

    if (!businessName || !fullName) {
      console.error('❌ Información de registro incompleta');
      // Note: using error from useOnboarding hook instead of local setError
      return;
    }

    try {
      // Try the original onboarding service first
      const result = await completeOnboarding();

      if (result.success && result.client) {
        console.log('✅ Onboarding completed successfully:', result.client);
        setCreatedClient(result.client);
        setSuccess(true);

        // Redirect to main dashboard after a brief delay
        console.log('✅ ONBOARDING: Success, redirecting to dashboard in 3 seconds');
        setTimeout(() => {
          if (!redirecting) {
            console.log('🔀 ONBOARDING: Executing redirect to /dashboard');
            setRedirecting(true);
            router.push('/dashboard');
          }
        }, 3000);
        return;
      }

      // If original method fails, show error
      console.log('❌ Onboarding service failed:', result.error);

      // Don't create mock clients - show the actual error
      // This prevents the infinite loop by not creating fake success states
      return;

    } catch (error) {
      console.error('🚨 Onboarding error:', error);
      // Don't create mock clients on error - let the error be displayed
      // This prevents the infinite loop
    }
  };

  // Loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success && createdClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Header */}
          <div>
            <Coffee className="h-16 w-16 text-orange-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Bienvenido a CafeMX!
            </h2>
            <p className="text-gray-600">
              Tu cafetería ha sido configurada exitosamente
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-900 mb-2">
              ¡Configuración Completa!
            </h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Cafetería:</strong> {createdClient.nombre_negocio}</p>
              <p><strong>URL:</strong> {createdClient.slug}.ycm360.com</p>
              <p><strong>Plan:</strong> Prueba gratuita (30 días)</p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
            <h4 className="text-sm font-medium text-blue-900 mb-3">
              Próximos pasos:
            </h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>✅ Cafetería creada</li>
              <li>🔄 Configurando dashboard...</li>
              <li>📱 Preparando herramientas</li>
              <li>☕ ¡Listo para usar!</li>
            </ul>
          </div>

          {/* Automatic Redirect */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Redirigiendo a tu dashboard en unos segundos...
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700"
            >
              Ir al Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Coffee className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">
            Configuración Final
          </h2>
          <p className="mt-2 text-gray-600">
            Vamos a configurar tu cafetería en CafeMX
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Información de registro
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{user.email}</span>
            </div>
            {user.user_metadata?.full_name && (
              <div>
                <span className="text-gray-600">Propietario:</span>
                <span className="ml-2 font-medium">{user.user_metadata.full_name}</span>
              </div>
            )}
            {user.user_metadata?.business_name && (
              <div>
                <span className="text-gray-600">Cafetería:</span>
                <span className="ml-2 font-medium">{user.user_metadata.business_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* What Will Be Created */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            Se creará para ti:
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Tu propio dashboard de gestión</li>
            <li>• Base de datos aislada y segura</li>
            <li>• Subdominio personalizado</li>
            <li>• 500 tickets OCR gratuitos</li>
            <li>• Acceso completo por 30 días</li>
          </ul>
        </div>

        {/* Complete Setup Button */}
        <div>
          <button
            onClick={handleCompleteOnboarding}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Configurando tu cafetería...
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-5 w-5" />
                Completar Configuración
              </>
            )}
          </button>
        </div>

        {/* Support */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            ¿Problemas con la configuración?{' '}
            <a 
              href="mailto:soporte@ycm360.com" 
              className="text-orange-600 hover:text-orange-500"
            >
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}