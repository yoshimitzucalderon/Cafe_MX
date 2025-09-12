'use client';

import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';

interface Ticket {
  id: string;
  concepto: string;
  total: number;
  fecha_ticket: string;
  status: 'pending' | 'processed' | 'review_needed' | 'error';
  ocr_confidence: number;
}

interface RecentTicketsProps {
  cafeteriaSlug: string;
}

export default function RecentTickets({ cafeteriaSlug }: RecentTicketsProps) {
  // Mock data - in real app, this would fetch from the tenant's database
  const mockTickets: Ticket[] = [
    {
      id: '1',
      concepto: 'Café Tostado Premium',
      total: 450.00,
      fecha_ticket: '2024-01-15',
      status: 'processed',
      ocr_confidence: 0.95
    },
    {
      id: '2',
      concepto: 'Leche Entera 1L',
      total: 28.50,
      fecha_ticket: '2024-01-15',
      status: 'review_needed',
      ocr_confidence: 0.72
    },
    {
      id: '3',
      concepto: 'Servicio Electricidad',
      total: 1250.00,
      fecha_ticket: '2024-01-14',
      status: 'processed',
      ocr_confidence: 0.88
    },
    {
      id: '4',
      concepto: 'Azúcar Refinada 2kg',
      total: 65.00,
      fecha_ticket: '2024-01-14',
      status: 'pending',
      ocr_confidence: 0.91
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'review_needed':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processed':
        return 'Procesado';
      case 'pending':
        return 'Pendiente';
      case 'review_needed':
        return 'Revisar';
      case 'error':
        return 'Error';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="space-y-4">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {ticket.concepto}
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{formatDate(ticket.fecha_ticket)}</span>
              <span>•</span>
              <span>Confianza: {Math.round(ticket.ocr_confidence * 100)}%</span>
            </div>
          </div>
          
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-medium text-gray-900">
              {formatCurrency(ticket.total)}
            </p>
            <div className="flex items-center justify-end space-x-1 mt-1">
              {getStatusIcon(ticket.status)}
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                {getStatusText(ticket.status)}
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {mockTickets.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No hay tickets recientes</p>
        </div>
      )}
      
      <div className="pt-4 border-t border-gray-200">
        <button className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium">
          Ver todos los tickets →
        </button>
      </div>
    </div>
  );
}