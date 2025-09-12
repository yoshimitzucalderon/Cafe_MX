import Link from 'next/link';
import { Coffee, Mail, ArrowLeft } from 'lucide-react';

export default function VerifyEmailPage() {
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
            Verifica tu Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Te hemos enviado un enlace de verificación
          </p>
        </div>

        {/* Email Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
            <Mail className="h-12 w-12 text-orange-600" />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            ¡Ya casi terminas!
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              1. Revisa tu bandeja de entrada (y la carpeta de spam)
            </p>
            <p>
              2. Haz clic en el enlace de verificación en el email
            </p>
            <p>
              3. Una vez verificado, podrás crear tu primera cafetería
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">
            Después de verificar tu email:
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Configura tu primera cafetería</li>
            <li>• Personaliza tu dashboard</li>
            <li>• Comienza a subir tickets con OCR</li>
            <li>• Prueba todas las funciones por 30 días</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              ¿No recibiste el email?
            </p>
            <button className="text-orange-600 hover:text-orange-500 font-medium text-sm">
              Reenviar email de verificación
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

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
  );
}