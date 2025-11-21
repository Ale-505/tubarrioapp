import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabaseService } from '@/src/services/supabaseService'; // Ruta corregida
import { Report, Comment } from '@/types';
import { User as UserType } from '@/types';
import { Edit2, Trash2, MessageSquare, FileText, ExternalLink } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { showError, showSuccess } from '@/src/utils/toast';

interface MyContributionsProps {
    user: UserType;
}

const MyContributions: React.FC<MyContributionsProps> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reports' | 'comments'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [comments, setComments] = useState<{comment: Comment, reportTitle: string, reportId: string}[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const myReports = await supabaseService.getUserReports(user.id);
      setReports(myReports);
      
      const myComments = await supabaseService.getUserComments(user.id);
      setComments(myComments);
    } catch (error) {
      console.error(error);
      showError('Error al cargar tus contribuciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleDeleteReport = async (id: string) => {
      if(window.confirm("¿Estás seguro de querer eliminar este reporte? Esta acción no se puede deshacer.")) {
          try {
            await supabaseService.deleteReport(id);
            setReports(prevReports => prevReports.filter(r => r.id !== id));
            showSuccess('Reporte eliminado.');
          } catch (e) {
              console.error(e);
              showError("Error al eliminar el reporte.");
          }
      }
  }

  const handleDeleteComment = async (reportId: string, commentId: string) => {
      if(window.confirm("¿Eliminar este comentario?")) {
          try {
            await supabaseService.deleteComment(reportId, commentId);
            setComments(prevComments => prevComments.filter(c => c.comment.id !== commentId));
            showSuccess('Comentario eliminado.');
          } catch (e) {
              console.error(e);
              showError("Error al eliminar el comentario.");
          }
      }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Mis Aportes</h1>
            <p className="text-slate-500">Gestiona tus reportes y comentarios realizados.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
            <button 
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                Reportes ({reports.length})
            </button>
            <button 
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'comments' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                Comentarios ({comments.length})
            </button>
        </div>
      </div>

      {loading ? (
         <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
         </div>
      ) : (
          <div className="space-y-4">
              {activeTab === 'reports' && (
                  <>
                    {reports.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 mb-4">No has realizado ningún reporte aún.</p>
                            <Link to="/crear-reporte" className="text-blue-600 font-medium hover:underline">Crear mi primer reporte</Link>
                        </div>
                    ) : (
                        reports.map(report => (
                            <div 
                                key={report.id} 
                                className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/reporte/${report.id}`)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <StatusBadge status={report.status} />
                                        <span className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-1 hover:text-blue-600">{report.title}</h3>
                                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">{report.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="bg-slate-100 px-2 py-1 rounded">{report.barrio}</span>
                                        <span>{report.supportCount} apoyos</span>
                                        <span>{report.comments.length} comentarios</span>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4 justify-center" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/editar-reporte/${report.id}`);
                                        }}
                                        className="flex items-center justify-center p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors group" title="Editar"
                                    >
                                        <Edit2 size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteReport(report.id);
                                        }}
                                        className="flex items-center justify-center p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors group" title="Eliminar"
                                    >
                                        <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                  </>
              )}

              {activeTab === 'comments' && (
                   <>
                   {comments.length === 0 ? (
                       <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                           <MessageSquare size={40} className="mx-auto text-slate-300 mb-3" />
                           <p className="text-slate-500">No has comentado en ningún reporte.</p>
                       </div>
                   ) : (
                       comments.map((item, idx) => (
                           <div key={item.comment.id} className="bg-white p-5 rounded-xl border border-slate-200 flex gap-4">
                               <div className="flex-1">
                                   <p className="text-xs text-slate-500 mb-2">
                                       En: <Link to={`/reporte/${item.reportId}`} className="font-medium text-blue-600 hover:underline">{item.reportTitle}</Link> • {new Date(item.comment.createdAt).toLocaleDateString()}
                                   </p>
                                   <p className="text-slate-800 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                                       {item.comment.content}
                                   </p>
                                   {item.comment.imageUrl && (
                                       <div className="mt-2">
                                            <span className="text-xs text-blue-600 flex items-center gap-1"><ExternalLink size={10}/> Contiene imagen adjunta</span>
                                       </div>
                                   )}
                               </div>
                               <div className="flex flex-col justify-center">
                                   <button 
                                       onClick={(e) => {
                                           e.stopPropagation();
                                           handleDeleteComment(item.reportId, item.comment.id);
                                       }}
                                       className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Eliminar aporte"
                                   >
                                       <Trash2 size={16} />
                                   </button>
                               </div>
                           </div>
                       ))
                   )}
                 </>
              )}
          </div>
      )}
    </div>
  );
};

export default MyContributions;