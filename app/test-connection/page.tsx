'use client';

import { useEffect, useState } from 'react';
import { testSupabaseConnection } from '../../lib/supabase/client-fallback';

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    error?: string;
    method: 'direct' | 'proxy' | 'failed';
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      setLoading(true);
      try {
        const result = await testSupabaseConnection();
        setConnectionStatus(result);
      } catch (error) {
        setConnectionStatus({
          success: false,
          method: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  const handleRetest = async () => {
    setLoading(true);
    try {
      const result = await testSupabaseConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        method: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                Test de Conexión Supabase
              </h1>

              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Probando conexión...</span>
                </div>
              ) : connectionStatus ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    connectionStatus.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-3 ${
                        connectionStatus.success ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`font-medium ${
                        connectionStatus.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {connectionStatus.success ? 'Conexión exitosa' : 'Conexión fallida'}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      <p><strong>Método:</strong> {connectionStatus.method}</p>
                      {connectionStatus.error && (
                        <p className="mt-1"><strong>Error:</strong> {connectionStatus.error}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <h3 className="font-medium text-gray-800">Estado de la configuración:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span>Variables de entorno</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          connectionStatus.method === 'proxy' ? 'bg-yellow-500' :
                          connectionStatus.success ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span>Conexión CORS</span>
                      </div>
                    </div>
                  </div>

                  {connectionStatus.success && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>✅ ¡Perfecto!</strong> Tu aplicación puede conectarse a Supabase.
                        {connectionStatus.method === 'proxy' && (
                          <span className="block mt-1">
                            Se está usando el proxy para evitar problemas de CORS.
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleRetest}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Probar de nuevo
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}