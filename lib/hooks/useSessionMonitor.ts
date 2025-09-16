import { useEffect } from 'react';
import { useAuth } from './useAuth';

interface SessionMonitorOptions {
  checkIntervalMs?: number;
  warningThresholdMs?: number;
  onSessionExpiringSoon?: () => void;
  onSessionExpired?: () => void;
}

export function useSessionMonitor({
  checkIntervalMs = 60000, // Check every minute
  warningThresholdMs = 300000, // Warn when 5 minutes left
  onSessionExpiringSoon,
  onSessionExpired
}: SessionMonitorOptions = {}) {
  const { session, user } = useAuth();

  useEffect(() => {
    if (!session || !user) return;

    const checkSession = () => {
      if (!session?.expires_at) return;

      const now = Date.now() / 1000; // Current time in seconds
      const expiresAt = session.expires_at;
      const timeLeft = (expiresAt - now) * 1000; // Time left in milliseconds

      console.log(`🕐 Session check: ${Math.round(timeLeft / 1000 / 60)} minutes left`);

      if (timeLeft <= 0) {
        console.warn('⚠️ Session expired!');
        onSessionExpired?.();
      } else if (timeLeft <= warningThresholdMs) {
        console.warn(`⚠️ Session expiring soon: ${Math.round(timeLeft / 1000 / 60)} minutes left`);
        onSessionExpiringSoon?.();
      }
    };

    // Initial check
    checkSession();

    // Set up interval
    const interval = setInterval(checkSession, checkIntervalMs);

    return () => clearInterval(interval);
  }, [session, user, checkIntervalMs, warningThresholdMs, onSessionExpiringSoon, onSessionExpired]);

  return {
    sessionExpiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : null,
    sessionValid: session?.expires_at ? (session.expires_at * 1000) > Date.now() : false
  };
}