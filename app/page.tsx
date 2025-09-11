import Link from 'next/link';
import { Coffee, FileText, BarChart3, Shield, Clock, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-orange-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">CafeMX</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/auth/login" 
                className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link 
                href="/auth/register" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Crear Cuenta
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Gestión Inteligente para
            <span className="text-orange-600 block">Cafeterías Mexicanas</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automatiza la gestión de gastos con OCR de tickets, maneja tu inventario, 
            procesa ventas y genera reportes. Todo en una plataforma diseñada para cafeterías.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register" 
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold text-lg"
            >
              Prueba Gratis 30 Días
            </Link>
            <Link 
              href="#features" 
              className="border border-orange-600 text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-lg font-semibold text-lg"
            >
              Ver Características
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para gestionar tu cafetería
            </h2>
            <p className="text-xl text-gray-600">
              Diseñado específicamente para el mercado mexicano
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
              <FileText className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">OCR de Tickets</h3>
              <p className="text-gray-600">
                Digitaliza automáticamente tickets de compras con IA. 
                Extrae RFC, montos, IVA y categoriza gastos al instante.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
              <BarChart3 className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Inventario y POS</h3>
              <p className="text-gray-600">
                Gestiona productos, controla stock, procesa ventas y 
                mantén tu inventario actualizado en tiempo real.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
              <Shield className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Datos Seguros</h3>
              <p className="text-gray-600">
                Aislamiento completo por cliente. Tus datos están 
                protegidos y nunca se mezclan con otras cafeterías.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
              <Clock className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reportes Automáticos</h3>
              <p className="text-gray-600">
                Genera reportes de gastos, ventas e inventario. 
                Cumple con requisitos fiscales mexicanos automáticamente.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
              <Zap className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Sucursal</h3>
              <p className="text-gray-600">
                Gestiona múltiples ubicaciones desde una sola cuenta.
                Cada sucursal con su propio subdominio y datos.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
              <Coffee className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Para Cafeterías</h3>
              <p className="text-gray-600">
                Categorías de productos específicas, plantillas de tickets,
                y flujos optimizados para el negocio del café.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Precio simple y transparente
            </h2>
            <p className="text-xl text-gray-600">
              Una sola tarifa por cafetería, sin sorpresas
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-8">
                <h3 className="text-2xl font-bold text-gray-900 text-center">Plan Cafetería</h3>
                <div className="mt-4 text-center">
                  <span className="text-4xl font-bold text-gray-900">$199</span>
                  <span className="text-xl text-gray-600"> MXN/mes</span>
                </div>
                <div className="mt-6">
                  <ul className="space-y-4">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      500 tickets OCR por mes
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Hasta 5 usuarios
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Inventario ilimitado
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      POS integrado
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Reportes fiscales
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Soporte por email
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <Link 
                    href="/auth/register" 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-semibold text-center block"
                  >
                    Comenzar Prueba Gratis
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Coffee className="h-8 w-8 text-orange-500" />
                <span className="ml-2 text-xl font-bold">CafeMX</span>
              </div>
              <p className="text-gray-400">
                Gestión inteligente para cafeterías mexicanas.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Características</a></li>
                <li><a href="#" className="hover:text-white">Precios</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentación</a></li>
                <li><a href="#" className="hover:text-white">Centro de Ayuda</a></li>
                <li><a href="mailto:contacto@ycm360.com" className="hover:text-white">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Términos</a></li>
                <li><a href="#" className="hover:text-white">Privacidad</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CafeMX. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}