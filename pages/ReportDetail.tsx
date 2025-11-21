import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseService } from '@/services/supabaseService'; // Usar el nuevo servicio
import { Report, ReportStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { MapPin, Calendar, User, ArrowLeft, Send, ThumbsUp, Image as ImageIcon, X, ChevronDown } from 'lucide-react';
import { useSession } from '@/src/components/SessionContextProvider';
import { showError, showSuccess } from '@/src/utils/toast';

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentFile, setCommentFile] = useState<File | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  
  const { user: currentUser } = useSession();
  const isAuthor = currentUser && report && currentUser.id === report.authorId;
  const isSupported = report?.supportedBy?.includes(currentUser?.id || '');

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await supabaseService.getReportById(id);
        if (data) setReport(data);
        else {
          showError('Reporte no encontrado.');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error(error);
        showError('Error al cargar el detalle del reporte.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, navigate]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !report || !currentUser) {
      showError('Debes iniciar sesión y escribir un comentario.');
      return;
    }
    setSubmitting(true);
    try {
      const addedComment = await supabaseService.addComment(report.id, newComment, commentFile, currentUser);
      if (addedComment) {
        setReport(prevReport => prevReport ? {
          ...prevReport,
          comments: [...prevReport.comments, addedComment]
        } : null);
        setNewComment('');
        setCommentFile(undefined);
      }
    } catch (err) {
      console.error(err);
      showError('Error al añadir el comentario.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupport = async () => {
      if(!report || !currentUser) {
        showError('Debes iniciar sesión para apoyar un reporte.');
        return;
      }
      try {
          const updatedReport = await supabaseService.toggleSupport(report.id, currentUser.id);
          if (updatedReport) {
            setReport(updatedReport);
          }
      } catch (e) {
          console.error(e);
          showError('Error al cambiar el estado de apoyo.');
      }
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!report || !isAuthor) {
        showError('No tienes permiso para cambiar el estado de este reporte.');
        return;
      }
      const newStatus = e.target.value as ReportStatus;
      try {
          const updatedReport = await supabaseService.updateReport(report.id, { status: newStatus });
          if (updatedReport) {
            setReport({ ...report, status: newStatus });
            showSuccess('Estado del reporte actualizado.');
          }
      } catch (error) {
          console.error("Error actualizando estado", error);
          showError('Error al actualizar el estado del reporte.');
      }
  };

  if (loading) return <div className="p-10 text-center">Cargando detalle...</div>;
  if (!report) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" /> Volver a búsqueda
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                 <h1 className="text-2xl font-bold text-slate-900 mb-2">{report.title}</h1>
                 <div className="flex items-center gap-2 text-sm text-slate-500">
                   <span className="font-medium text-blue-600">#{report.id.substring(0, 8)}</span>
                   <span>•</span>
                   <Calendar size={14} />
                   <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                 </div>
              </div>
              
              {isAuthor ? (
                  <div className="relative">
                      <label htmlFor="status-select" className="sr-only">Cambiar estado</label>
                      <div className="flex items-center border border-slate-300 rounded-full bg-slate-50 px-3 py-1 hover:bg-white transition-colors">
                        <span className={`w-2 h-2 rounded-full mr-2 ${report.status === 'Abierto' ? 'bg-yellow-500' : report.status === 'Resuelto' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                        <select 
                            id="status-select"
                            value={report.status} 
                            onChange={handleStatusChange}
                            className="appearance-none bg-transparent text-xs font-bold text-slate-700 cursor-pointer focus:outline-none pr-4 py-1"
                        >
                            <option value="Abierto">Abierto</option>
                            <option value="En proceso">En proceso</option>
                            <option value="Resuelto">Resuelto</option>
                        </select>
                        <ChevronDown size={14} className="text-slate-500 pointer-events-none" />
                      </div>
                  </div>
              ) : (
                  <StatusBadge status={report.status} />
              )}
            </div>

            <div className="prose prose-blue max-w-none text-slate-700 mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Descripción</h3>
              <p>{report.description}</p>
            </div>

            {report.images.length > 0 && (
              <div className="mb-6">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Evidencia Fotográfica</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {report.images.map((img, idx) => (
                     <img key={idx} src={img} alt="Evidencia" className="rounded-lg border border-slate-200 w-full h-64 object-cover" />
                   ))}
                 </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button 
                    onClick={handleSupport}
                    disabled={!currentUser}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                        isSupported 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title={!currentUser ? 'Inicia sesión para apoyar' : (isSupported ? 'Ya has apoyado este reporte' : 'Apoyar reporte')}
                >
                    <ThumbsUp size={18} className={isSupported ? "fill-white" : ""} />
                    <span className="font-medium">
                        {report.supportCount} {report.supportCount === 1 ? 'Apoyo' : 'Apoyos'}
                    </span>
                </button>
            </div>
          </div>

          {/* Contributions / Comments */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-6 shadow-sm">
             <h3 className="text-lg font-bold text-slate-900 mb-6">Aportes ciudadanos</h3>
             
             <div className="space-y-6 mb-8">
               {report.comments.length === 0 ? (
                 <p className="text-slate-500 italic text-center py-4">No hay aportes aún. Sé el primero en comentar.</p>
               ) : (
                 report.comments.map(comment => (
                   <div key={comment.id} className="flex gap-4">
                     <div className="flex-shrink-0">
                       <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                         {comment.userName.charAt(0).toUpperCase()}
                       </div>
                     </div>
                     <div className="flex-1 bg-slate-50 rounded-lg p-4">
                       <div className="flex justify-between items-center mb-1">
                         <span className="font-medium text-slate-900">{comment.userName}</span>
                         <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                       </div>
                       <p className="text-slate-700 text-sm">{comment.content}</p>
                       {comment.imageUrl && (
                           <div className="mt-3">
                               <img src={comment.imageUrl} alt="Evidencia aporte" className="h-32 rounded-md border border-slate-200 cursor-pointer hover:opacity-90" onClick={() => window.open(comment.imageUrl, '_blank')} />
                           </div>
                       )}
                     </div>
                   </div>
                 ))
               )}
             </div>

             {/* Add Comment Form */}
             {currentUser ? (
                 <form onSubmit={handleAddComment} className="relative">
                    <div className="border border-slate-300 rounded-md shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-white">
                       <textarea
                         rows={3}
                         className="block w-full border-0 rounded-t-md focus:ring-0 sm:text-sm px-4 py-3 resize-none"
                         placeholder="Agrega información adicional, actualizaciones o comentarios..."
                         value={newComment}
                         onChange={(e) => setNewComment(e.target.value)}
                       />
                       <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-b-md border-t border-slate-100">
                           <div className="flex items-center">
                               <label className={`cursor-pointer p-2 rounded-full hover:bg-slate-200 transition-colors ${commentFile ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`} title="Adjuntar imagen">
                                   <ImageIcon size={20} />
                                   <input type="file" className="hidden" accept="image/*" onChange={(e) => setCommentFile(e.target.files?.[0])} />
                               </label>
                               {commentFile && (
                                   <span className="text-xs text-blue-600 ml-2 flex items-center">
                                       {commentFile.name}
                                       <button type="button" onClick={() => setCommentFile(undefined)} className="ml-1 hover:text-red-500"><X size={12}/></button>
                                   </span>
                               )}
                           </div>
                           <button 
                             type="submit" 
                             disabled={submitting || !newComment.trim()}
                             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                           >
                             <Send size={14} className="mr-2"/>
                             Enviar aporte
                           </button>
                       </div>
                    </div>
                 </form>
             ) : (
                 <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                     <p className="text-slate-600 text-sm">Inicia sesión para dejar un aporte.</p>
                 </div>
             )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Información del reporte</h3>
            
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Reportado por</dt>
                <dd className="font-medium text-slate-900 flex items-center gap-1 mt-1">
                  <User size={14} /> {report.authorName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Ubicación</dt>
                <dd className="font-medium text-slate-900 flex items-center gap-1 mt-1">
                   <MapPin size={14} /> {report.location}
                </dd>
                <dd className="text-slate-500 text-xs ml-5">{report.barrio}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Categoría</dt>
                <dd className="font-medium text-slate-900 mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-800">
                  {report.type}
                </dd>
              </div>
            </dl>
          </div>

           <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
              <h4 className="font-bold text-blue-800 mb-2">Estado de seguimiento</h4>
              <p className="text-sm text-blue-600">
                 Este reporte se encuentra <strong>{report.status}</strong>. 
                 {report.status === 'Resuelto' 
                    ? ' ¡Gracias por ayudar a mejorar tu comunidad!' 
                    : ' Las autoridades y vecinos pueden ver esta información.'}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;