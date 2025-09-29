import { useState } from 'react';
import { useAuth } from './useAuth';
import { RateLimiter } from './useDebounce';

interface OnboardingClient {
  id: string;
  nombre_negocio: string;
  slug: string;
  schema_name: string;
  dashboard_url: string;
}

interface OnboardingResult {
  success: boolean;
  client?: OnboardingClient;
  error?: string;
}

interface OnboardingCheckResult {
  needsOnboarding: boolean;
  userId?: string;
  error?: string;
}

// Rate limiter for onboarding checks (max 3 calls per 5 seconds)
const onboardingRateLimiter = new RateLimiter(3, 5000);

export function useOnboarding() {
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    console.log('🔐 useOnboarding - Getting auth headers');
    console.log('🔐 Session exists:', !!session);
    console.log('🔐 Access token exists:', !!session?.access_token);
    console.log('🔐 Token preview:', session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'null');

    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  };

  const completeOnboarding = async (): Promise<OnboardingResult> => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const result: OnboardingResult = await response.json();

      if (!response.ok) {
        setError(result.error || 'Error durante el onboarding');
        return result;
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido durante el onboarding';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const checkNeedsOnboarding = async (): Promise<OnboardingCheckResult> => {
    if (!user || !session?.access_token) {
      console.log('⏸️ Skipping onboarding check - no authenticated user');
      return { needsOnboarding: false, error: 'Usuario no autenticado' };
    }

    // Check rate limiter before making API call
    if (!onboardingRateLimiter.canMakeCall()) {
      console.log('🚦 Rate limit exceeded for onboarding check, skipping call');
      return { needsOnboarding: false, error: 'Rate limit exceeded' };
    }

    try {
      console.log('🔄 Checking onboarding status for:', user.email);
      const response = await fetch('/api/auth/onboarding', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const result: OnboardingCheckResult = await response.json();

      if (!response.ok) {
        console.log('❌ Onboarding check failed:', response.status, result.error);
        return { needsOnboarding: false, error: result.error };
      }

      console.log('✅ Onboarding check result:', result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error checking onboarding status';
      console.error('🚨 Onboarding check error:', errorMessage);
      return { needsOnboarding: false, error: errorMessage };
    }
  };

  return {
    isLoading,
    error,
    completeOnboarding,
    checkNeedsOnboarding
  };
}