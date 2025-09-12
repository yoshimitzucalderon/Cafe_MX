import { Suspense } from 'react';
import { Coffee, FileText, Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import StatsCard from '../../../components/dashboard/StatsCard';
import RecentTickets from '../../../components/dashboard/RecentTickets';
import SalesChart from '../../../components/dashboard/SalesChart';
import LowStockAlert from '../../../components/dashboard/LowStockAlert';

interface PageProps {
  params: {
    cafeteria: string;
  };
}

export default function DashboardPage({ params }: PageProps) {
  const { cafeteria } = params;

  return (
    <DashboardLayout cafeteriaSlug={cafeteria}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Resumen de actividad de tu cafetería
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Suspense fallback={<StatsCardSkeleton />}>
            <StatsCard
              title="Tickets este mes"
              value="47"
              change="+12%"
              changeType="positive"
              icon={FileText}
              description="vs mes anterior"
            />
          </Suspense>
          
          <Suspense fallback={<StatsCardSkeleton />}>
            <StatsCard
              title="Ingresos del día"
              value="$2,847"
              change="+8%"
              changeType="positive"
              icon={DollarSign}
              description="vs ayer"
            />
          </Suspense>
          
          <Suspense fallback={<StatsCardSkeleton />}>
            <StatsCard
              title="Productos activos"
              value="23"
              change="2"
              changeType="neutral"
              icon={Package}
              description="stock bajo alertado"
            />
          </Suspense>
          
          <Suspense fallback={<StatsCardSkeleton />}>
            <StatsCard
              title="Ventas del mes"
              value="156"
              change="+23%"
              changeType="positive"
              icon={TrendingUp}
              description="vs mes anterior"
            />
          </Suspense>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Ventas de los últimos 7 días
                </h2>
                <select className="text-sm border-gray-300 rounded-md">
                  <option>Últimos 7 días</option>
                  <option>Últimos 30 días</option>
                  <option>Últimos 3 meses</option>
                </select>
              </div>
              <Suspense fallback={<ChartSkeleton />}>
                <SalesChart cafeteriaSlug={cafeteria} />
              </Suspense>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            {/* Recent Tickets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tickets Recientes
              </h2>
              <Suspense fallback={<TicketsSkeleton />}>
                <RecentTickets cafeteriaSlug={cafeteria} />
              </Suspense>
            </div>

            {/* Low Stock Alert */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                Stock Bajo
              </h2>
              <Suspense fallback={<StockSkeleton />}>
                <LowStockAlert cafeteriaSlug={cafeteria} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">Subir Ticket</span>
            </button>
            
            <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Package className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium">Nueva Venta</span>
            </button>
            
            <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Coffee className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-medium">Añadir Producto</span>
            </button>
            
            <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium">Ver Reportes</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Loading Skeletons
function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}

function TicketsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StockSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      ))}
    </div>
  );
}