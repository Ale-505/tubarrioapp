import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { reportService } from '@/src/services'; // Importar desde el índice de servicios
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
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const REPORTS_PER_PAGE = 9; // Mostrar 9 reportes por página

  const fetchReports = async (page: number, append: boolean = false) => {
    setLoading(true);
    try {
      const { reports: newReports, totalCount } = await reportService.getReports(page, REPORTS_PER_PAGE);
      
      if (append) {
        setReports(prevReports => [...prevReports, ...newReports]);
      } else {
        setReports(newReports);
      }
      const currentTotalReportsLoaded = append ? reports.length + newReports.length : newReports.length;
      setHasMore(currentTotalReportsLoaded < totalCount);
    } catch (error) {
      console.error(error);
      showError('Error al cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Resetear la página cuando los filtros cambian
    fetchReports(1);
  }, [filters.keyword, filters.barrio, filters.type]); // Volver a cargar cuando los filtros cambian

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchReports(nextPage, true); // Añadir nuevos reportes
  };

  // Comprobación defensiva: Asegurarse de que 'reports' es un array antes de llamar a filter
  const filteredReports = Array.isArray(reports) ? reports.filter(report => {
    const matchKeyword = report.title.toLowerCase().includes(filters.keyword.toLowerCase()) || 
                         report.description.toLowerCase().includes(filters.keyword.toLowerCase());
    const matchBarrio = filters.barrio ? report.barrio === filters.barrio : true;
    const matchType = filters.type ? report.type === filters.type : true;
    return matchKeyword && matchBarrio && matchType;
  }) : [];

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
      {loading && reports.length === 0 ? ( // Mostrar spinner de carga inicial solo si no hay reportes cargados
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
          
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cargando más...' : 'Cargar más reportes'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;