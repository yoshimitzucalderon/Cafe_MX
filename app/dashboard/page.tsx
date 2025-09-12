'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, Loader, Building2, ArrowRight, Plus, User, LogOut } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { onboardingService } from '../../lib/auth/onboarding-service';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, userClients, loading, signOut, refreshUserClients } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleDashboardRedirect = async () => {
      // Wait for auth to load
      if (loading) return;

      // If no user, redirect to login
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        // Refresh user clients to get latest data
        await refreshUserClients();

        // Check if user needs onboarding
        const needsOnboarding = await onboardingService.needsOnboarding(user.id);
        
        if (needsOnboarding) {
          router.push('/onboarding');
          return;
        }

        // User has clients - redirect to first client or show selector
        // Note: userClients might not be loaded yet, so we'll show a selector
        setIsLoading(false);

      } catch (error) {
        console.error('Error in dashboard redirect logic:', error);
        setError('Error al cargar el dashboard. Por favor, intenta de nuevo.');
        setIsLoading(false);
      }
    };

    handleDashboardRedirect();
  }, [user, loading, router, refreshUserClients]);

  // Auto-redirect if user has exactly one client
  useEffect(() => {
    if (!loading && !isLoading && userClients.length === 1) {
      const client = userClients[0];
      const dashboardUrl = `/${client.cliente.slug}/dashboard`;
      router.push(dashboardUrl);
    }
  }, [userClients, loading, isLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-6">
          <Coffee className="h-12 w-12 text-orange-600 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Multiple clients selector
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-orange-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">CafeMX</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-700">
                <User className="h-4 w-4 mr-1" />
                {user?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Selecciona tu Cafetería
            </h1>
            <p className="text-gray-600">
              Elige la cafetería que quieres gestionar
            </p>
          </div>

          {/* Client Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userClients.map((clientAccess) => (
              <div
                key={clientAccess.cliente_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <Building2 className="h-8 w-8 text-orange-600" />
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {clientAccess.rol}
                  </span>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {clientAccess.cliente.nombre_negocio}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {clientAccess.cliente.slug}.ycm360.com
                </p>
                
                <Link
                  href={`/${clientAccess.cliente.slug}/dashboard`}
                  className="inline-flex items-center w-full justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700"
                >
                  Abrir Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ))}

            {/* Add New Client Card */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-6 hover:border-orange-300 transition-colors">
              <div className="text-center">
                <Plus className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nueva Cafetería
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Agrega otra cafetería a tu cuenta
                </p>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* No Clients State */}
          {userClients.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes cafeterías configuradas
              </h3>
              <p className="text-gray-600 mb-6">
                Parece que no tienes acceso a ninguna cafetería todavía.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Crear Mi Primera Cafetería
              </Link>
            </div>
          )}

          {/* Account Info */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información de la Cuenta
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{user?.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Cafeterías:</span>
                <span className="ml-2 font-medium">{userClients.length}</span>
              </div>
              {user?.user_metadata?.full_name && (
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <span className="ml-2 font-medium">{user.user_metadata.full_name}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Plan:</span>
                <span className="ml-2 font-medium">Básico</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}