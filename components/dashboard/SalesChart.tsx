'use client';

import { useMemo } from 'react';

interface SalesChartProps {
  cafeteriaSlug: string;
}

export default function SalesChart({ cafeteriaSlug }: SalesChartProps) {
  // Mock data for the last 7 days
  const salesData = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const amounts = [2150, 1890, 2340, 2780, 3200, 2950, 2650];
    const maxAmount = Math.max(...amounts);
    
    return days.map((day, index) => ({
      day,
      amount: amounts[index],
      height: (amounts[index] / maxAmount) * 100
    }));
  }, []);

  const totalSales = salesData.reduce((sum, day) => sum + day.amount, 0);
  const averageSales = Math.round(totalSales / salesData.length);

  return (
    <div>
      {/* Chart */}
      <div className="relative h-64 flex items-end justify-between space-x-2 mb-4">
        {salesData.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-orange-500 rounded-t-md hover:bg-orange-600 transition-colors cursor-pointer relative group"
              style={{ height: `${data.height}%` }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ${data.amount.toLocaleString()}
              </div>
            </div>
            <span className="text-xs text-gray-600 mt-2">{data.day}</span>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Total 7 días</p>
          <p className="text-lg font-semibold text-gray-900">
            ${totalSales.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Promedio diario</p>
          <p className="text-lg font-semibold text-gray-900">
            ${averageSales.toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Growth indicator */}
      <div className="mt-4 flex items-center justify-center text-sm">
        <div className="flex items-center text-green-600">
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="font-medium">+8.2%</span>
          <span className="text-gray-500 ml-1">vs semana anterior</span>
        </div>
      </div>
    </div>
  );
}