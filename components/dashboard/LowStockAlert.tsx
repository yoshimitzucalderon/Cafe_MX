'use client';

import { Package, AlertTriangle } from 'lucide-react';

interface LowStockProduct {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  deficit: number;
}

interface LowStockAlertProps {
  cafeteriaSlug: string;
}

export default function LowStockAlert({ cafeteriaSlug }: LowStockAlertProps) {
  // Mock data - in real app, this would fetch from the tenant's database
  const lowStockProducts: LowStockProduct[] = [
    {
      id: '1',
      nombre: 'Café Molido Premium',
      stock_actual: 2,
      stock_minimo: 5,
      deficit: 3
    },
    {
      id: '2',
      nombre: 'Leche Entera',
      stock_actual: 1,
      stock_minimo: 3,
      deficit: 2
    },
    {
      id: '3',
      nombre: 'Azúcar Blanca',
      stock_actual: 0,
      stock_minimo: 2,
      deficit: 2
    }
  ];

  const getStockLevel = (actual: number, minimo: number) => {
    if (actual === 0) return 'critical';
    if (actual <= minimo * 0.5) return 'low';
    return 'warning';
  };

  const getStockColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'low':
        return 'text-orange-600 bg-orange-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStockText = (level: string) => {
    switch (level) {
      case 'critical':
        return 'Agotado';
      case 'low':
        return 'Crítico';
      case 'warning':
        return 'Bajo';
      default:
        return 'Normal';
    }
  };

  return (
    <div className="space-y-3">
      {lowStockProducts.map((product) => {
        const level = getStockLevel(product.stock_actual, product.stock_minimo);
        
        return (
          <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  level === 'critical' ? 'bg-red-100' : 
                  level === 'low' ? 'bg-orange-100' : 'bg-yellow-100'
                }`}>
                  <Package className={`h-4 w-4 ${
                    level === 'critical' ? 'text-red-600' : 
                    level === 'low' ? 'text-orange-600' : 'text-yellow-600'
                  }`} />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900">{product.nombre}</p>
                <p className="text-xs text-gray-500">
                  Stock: {product.stock_actual} / Min: {product.stock_minimo}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockColor(level)}`}>
                {getStockText(level)}
              </span>
              {product.deficit > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Faltan {product.deficit}
                </p>
              )}
            </div>
          </div>
        );
      })}
      
      {lowStockProducts.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Todo el stock está en niveles normales</p>
        </div>
      )}
      
      <div className="pt-4 border-t border-gray-200">
        <button className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium">
          Ver inventario completo →
        </button>
      </div>
    </div>
  );
}