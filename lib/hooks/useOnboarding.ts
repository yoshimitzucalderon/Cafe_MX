import { useState } from 'react';
import { useAuth } from './useAuth';

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

export function useOnboarding() {
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
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
    if (!user) {
      return { needsOnboarding: false, error: 'Usuario no autenticado' };
    }

    try {
      const response = await fetch('/api/auth/onboarding', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const result: OnboardingCheckResult = await response.json();

      if (!response.ok) {
        return { needsOnboarding: false, error: result.error };
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error checking onboarding status';
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