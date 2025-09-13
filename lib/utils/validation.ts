/**
 * Client-side validation utilities
 * These functions can be used on the client without requiring server-side dependencies
 */

/**
 * Validate business name for slug generation
 */
export function validateBusinessName(businessName: string): { valid: boolean; error?: string } {
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
export function validateRFC(rfc?: string): { valid: boolean; error?: string } {
  if (!rfc || rfc.trim().length === 0) {
    return { valid: true }; // RFC is optional
  }

  // Basic RFC validation - should be 12 or 13 characters
  const rfcTrimmed = rfc.trim().toUpperCase();

  // Physical person RFC (13 characters): 4 letters + 6 digits + 3 alphanumeric
  // Moral person RFC (12 characters): 3 letters + 6 digits + 3 alphanumeric
  const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;

  if (!rfcRegex.test(rfcTrimmed)) {
    return { valid: false, error: 'El RFC no tiene un formato válido' };
  }

  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'El email es obligatorio' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'El formato del email no es válido' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length === 0) {
    return { valid: false, error: 'La contraseña es obligatoria' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  if (password.length > 100) {
    return { valid: false, error: 'La contraseña es demasiado larga' };
  }

  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { valid: false, error: 'La contraseña debe contener al menos una letra y un número' };
  }

  return { valid: true };
}

/**
 * Validate full name
 */
export function validateFullName(fullName: string): { valid: boolean; error?: string } {
  if (!fullName || fullName.trim().length === 0) {
    return { valid: false, error: 'El nombre completo es obligatorio' };
  }

  if (fullName.trim().length < 2) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }

  if (fullName.trim().length > 100) {
    return { valid: false, error: 'El nombre es demasiado largo' };
  }

  // Check for valid characters (letters, spaces, accents, hyphens, apostrophes)
  const validNameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-']+$/;
  if (!validNameRegex.test(fullName.trim())) {
    return { valid: false, error: 'El nombre contiene caracteres no válidos' };
  }

  return { valid: true };
}

/**
 * Validate phone number (optional, Mexican format)
 */
export function validatePhone(phone?: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim().length === 0) {
    return { valid: true }; // Phone is optional
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Mexican phone numbers should be 10 digits
  if (digitsOnly.length !== 10) {
    return { valid: false, error: 'El teléfono debe tener 10 dígitos' };
  }

  // Should start with valid area codes (not starting with 0 or 1)
  if (digitsOnly.startsWith('0') || digitsOnly.startsWith('1')) {
    return { valid: false, error: 'El teléfono no tiene un formato válido' };
  }

  return { valid: true };
}