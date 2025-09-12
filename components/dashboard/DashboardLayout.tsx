'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Coffee, 
  LayoutDashboard, 
  FileText, 
  Package, 
  ShoppingCart, 
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Building2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/hooks/useAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
  cafeteriaSlug: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tickets', href: '/tickets', icon: FileText },
  { name: 'Productos', href: '/productos', icon: Package },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export default function DashboardLayout({ children, cafeteriaSlug }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, userClients, signOut } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Find current client info
  const currentClient = userClients.find(c => c.cliente.slug === cafeteriaSlug);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getFullPath = (href: string) => `/${cafeteriaSlug}${href}`;
  
  const isActive = (href: string) => {
    const fullPath = getFullPath(href);
    return pathname === fullPath || pathname.startsWith(fullPath + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-orange-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">CafeMX</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Cafeteria Info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Coffee className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {cafeteriaSlug.replace(/-/g, ' ')}
                </p>
                <p className="text-xs text-gray-500">
                  {cafeteriaSlug}.ycm360.com
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={getFullPath(item.href)}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    active
                      ? "bg-orange-100 text-orange-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      active ? "text-orange-500" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">Usuario</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <button className="text-gray-400 hover:text-gray-500">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6 text-gray-500" />
            </button>

            <div className="flex items-center space-x-4">
              {/* Current Client Info */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                <span>{currentClient?.cliente.nombre_negocio || cafeteriaSlug}</span>
              </div>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="hidden md:inline text-gray-700">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.user_metadata?.full_name || 'Usuario'}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      {currentClient && (
                        <p className="text-xs text-gray-400 mt-1">
                          Rol: {currentClient.rol}
                        </p>
                      )}
                    </div>

                    {/* Navigation */}
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2" />
                          Mis Cafeterías
                        </div>
                      </Link>
                      
                      <Link
                        href={`/${cafeteriaSlug}/configuracion`}
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          Configuración
                        </div>
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-gray-200 py-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleSignOut();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <LogOut className="h-4 w-4 mr-2" />
                          Cerrar Sesión
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}