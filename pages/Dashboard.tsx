import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { supabaseService } from '../services/supabaseService'; // Usar el nuevo servicio
import { Report, FilterState } from '../types';
import { BARRIOS, REPORT_TYPES } from '../constants';
import ReportCard from '../components/ReportCard';
import { showError } from '@/src/utils/toast';

const Dashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    barrio: '',
    type: ''
  });

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const data = await supabaseService.getReports();
        setReports(data);
      } catch (error) {
        console.error(error);
        showError('Error al cargar los reportes.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchKeyword = report.title.toLowerCase().includes(filters.keyword.toLowerCase()) || 
                         report.description.toLowerCase().includes(filters.keyword.toLowerCase());
    const matchBarrio = filters.barrio ? report.barrio === filters.barrio : true;
    const matchType = filters.type ? report.type === filters.type : true;
    return matchKeyword && matchBarrio && matchType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header & Filters */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Explorar Reportes</h1>
        <p className="text-slate-500 mb-6">Visualiza los problemas reportados en tu comunidad.</p>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por palabra clave..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </div>

          {/* Barrio Select */}
          <div>
             <select
                className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filters.barrio}
                onChange={(e) => setFilters({...filters, barrio: e.target.value})}
             >
               <option value="">Todos los barrios</option>
               {BARRIOS.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
          </div>

          {/* Type Select */}
          <div>
             <select
                className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
             >
               <option value="">Todos los tipos</option>
               {REPORT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
             </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {filteredReports.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredReports.map(report => (
                 <ReportCard key={report.id} report={report} />
               ))}
             </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-300">
              <Filter size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No se encontraron reportes</h3>
              <p className="text-slate-500">Intenta ajustar tus filtros de búsqueda.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;