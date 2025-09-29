'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, Building2, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';

export default function NuevaCafeteriaPage() {
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdClient, setCreatedClient] = useState<any>(null);

  const { user, session, loading } = useAuth();
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError('Por favor ingresa el nombre de tu cafetería');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nueva-cafeteria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          business_name: businessName.trim(),
          owner_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Propietario',
          plan: 'basic'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la cafetería');
      }

      const result = await response.json();
      setCreatedClient(result.client);
      setSuccess(true);

      // Redirect after a brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Error creating coffee shop:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al crear la cafetería');
    } finally {
      setIsLoading(false);
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
              ¡Cafetería Creada!
            </h2>
            <p className="text-gray-600">
              Tu nueva cafetería ha sido configurada exitosamente
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

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={createdClient.dashboard_url}
              className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700"
            >
              Abrir Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              Ver Todas las Cafeterías
            </Link>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Redirigiendo al selector de cafeterías en unos segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </div>

        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <Coffee className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">
              Nueva Cafetería
            </h2>
            <p className="mt-2 text-gray-600">
              Agrega una nueva cafetería a tu cuenta
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información Básica
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="business-name" className="block text-sm font-medium text-gray-700">
                    Nombre de la Cafetería *
                  </label>
                  <div className="mt-1">
                    <input
                      id="business-name"
                      name="business-name"
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      placeholder="Ej: Café Central"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Este será el nombre visible de tu cafetería
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Propietario
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={user?.user_metadata?.full_name || user?.email || ''}
                      disabled
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* What Will Be Created */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Se creará para ti:
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Dashboard de gestión independiente</li>
                <li>• Base de datos aislada y segura</li>
                <li>• Subdominio personalizado</li>
                <li>• 500 tickets OCR gratuitos</li>
                <li>• Acceso completo por 30 días</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !businessName.trim()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Creando cafetería...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-5 w-5" />
                    Crear Cafetería
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Support */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              ¿Necesitas ayuda?{' '}
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
    </div>
  );
}