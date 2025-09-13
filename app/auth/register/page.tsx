'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coffee, Eye, EyeOff, Mail, Lock, User, Building2, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../lib/hooks/useAuth';
import { validateBusinessName, validateRFC, validateFullName, validateEmail, validatePassword, validatePhone } from '../../../lib/utils/validation';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    rfc: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { signUp } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Basic validation
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        setIsLoading(false);
        return;
      }

      if (!formData.acceptTerms) {
        setError('Debes aceptar los términos y condiciones');
        setIsLoading(false);
        return;
      }

      // Client-side validation
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        setError(emailValidation.error!);
        setIsLoading(false);
        return;
      }

      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.error!);
        setIsLoading(false);
        return;
      }

      const nameValidation = validateFullName(formData.ownerName);
      if (!nameValidation.valid) {
        setError(nameValidation.error!);
        setIsLoading(false);
        return;
      }

      const businessValidation = validateBusinessName(formData.businessName);
      if (!businessValidation.valid) {
        setError(businessValidation.error!);
        setIsLoading(false);
        return;
      }

      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.valid) {
        setError(phoneValidation.error!);
        setIsLoading(false);
        return;
      }

      // Validate RFC if provided
      const rfcValidation = validateRFC(formData.rfc);
      if (!rfcValidation.valid) {
        setError(rfcValidation.error!);
        setIsLoading(false);
        return;
      }

      console.log('🚀 Starting registration process...');

      // Step 1: Create auth user
      const { error: authError } = await signUp(
        formData.email.trim(),
        formData.password,
        {
          full_name: formData.ownerName.trim(),
          business_name: formData.businessName.trim(),
          phone: formData.phone.trim() || undefined,
        }
      );

      if (authError) {
        console.error('❌ Auth registration failed:', authError);
        setError(authError);
        setIsLoading(false);
        return;
      }

      console.log('✅ User authentication created successfully');
      setSuccess(true);
      
      // Redirect to a success page or dashboard after a brief delay
      setTimeout(() => {
        router.push('/auth/verify-email');
      }, 2000);

    } catch (error) {
      console.error('🚨 Registration error:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido durante el registro');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <Coffee className="h-12 w-12 text-orange-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">CafeMX</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Comienza tu prueba gratuita de 30 días
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm text-green-800">
                ¡Cuenta creada exitosamente! Revisa tu email para verificar tu cuenta.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Nombre de la Cafetería *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ej: Café Central"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                Nombre del Propietario *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Tu nombre completo"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="+52 555 123 4567"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rfc" className="block text-sm font-medium text-gray-700">
                RFC (Opcional)
              </label>
              <div className="mt-1 relative">
                <input
                  id="rfc"
                  name="rfc"
                  type="text"
                  value={formData.rfc}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="XAXX010101000"
                  maxLength={13}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Para generar facturas automáticamente (opcional)
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Mínimo 8 caracteres"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Repite tu contraseña"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              required
              checked={formData.acceptTerms}
              onChange={handleInputChange}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
              Acepto los{' '}
              <a href="#" className="text-orange-600 hover:text-orange-500">
                términos y condiciones
              </a>{' '}
              y la{' '}
              <a href="#" className="text-orange-600 hover:text-orange-500">
                política de privacidad
              </a>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || success}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {success 
                ? '¡Cuenta Creada! Redirigiendo...' 
                : isLoading 
                  ? 'Creando cuenta...' 
                  : 'Crear Cuenta y Comenzar Prueba'
              }
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="font-medium text-orange-600 hover:text-orange-500">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </form>

        {/* Trial Info */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-2">
            🎉 Incluye en tu prueba gratuita:
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• 30 días de acceso completo</li>
            <li>• 100 tickets OCR gratis</li>
            <li>• Soporte por email</li>
            <li>• Sin compromisos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}