'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coffee, Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useOnboarding } from '../../../lib/hooks/useOnboarding';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, user, loading, session } = useAuth();
  const { checkNeedsOnboarding } = useOnboarding();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && session?.access_token) {
      console.log('🔑 User already authenticated, redirecting...');
      checkOnboardingAndRedirect();
    } else if (!loading && !user) {
      console.log('👤 No authenticated user found');
    }
  }, [user, session, loading]);

  const checkOnboardingAndRedirect = async () => {
    try {
      console.log('🔄 Checking onboarding status...');
      const result = await checkNeedsOnboarding();
      console.log('📊 Onboarding result:', result);

      if (result.needsOnboarding) {
        console.log('➡️ Redirecting to onboarding...');
        router.push('/onboarding');
      } else {
        console.log('➡️ Redirecting to dashboard...');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Fallback to dashboard
      console.log('➡️ Fallback redirect to dashboard...');
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('🚀 Starting login process...');
      const { error: loginError } = await signIn(email.trim(), password);

      if (loginError) {
        console.error('❌ Login failed:', loginError);
        setError(loginError);
        setIsLoading(false);
        return;
      }

      console.log('✅ Login successful, waiting for auth state update...');

      // The useEffect hook will handle the redirect when the user state updates
      // Keep loading state until redirect happens

    } catch (error) {
      console.error('🚨 Login error:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido durante el inicio de sesión');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center">
            <Coffee className="h-12 w-12 text-orange-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">CafeMX</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accede a tu cuenta para gestionar tu cafetería
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="tu@email.com"
                  disabled={isLoading}
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Recordarme
              </label>
            </div>

            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-orange-600 hover:text-orange-500">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link href="/auth/signup" className="font-medium text-orange-600 hover:text-orange-500">
              Crear cuenta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}