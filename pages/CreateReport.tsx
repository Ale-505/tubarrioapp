import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, MapPin, AlertCircle, Save } from 'lucide-react';
import { supabaseService } from '@/services/supabaseService'; // Usar el nuevo servicio
import { BARRIOS, REPORT_TYPES } from '@/constants';
import { ReportType } from '@/types';
import { useSession } from '@/src/components/SessionContextProvider';
import { showError, showSuccess } from '@/src/utils/toast';

const CreateReport: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user: currentUser } = useSession();

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    barrio: '',
    location: '',
    description: ''
  });
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [file, setFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchReport = async () => {
        try {
          const report = await supabaseService.getReportById(id);
          if (report && currentUser && report.authorId === currentUser.id) {
             setFormData({
               title: report.title,
               type: report.type,
               barrio: report.barrio,
               location: report.location,
               description: report.description
             });
             setExistingImageUrls(report.images);
          } else {
             showError('No tienes permiso para editar este reporte o no existe.');
             navigate('/dashboard');
          }
        } catch (err) {
          console.error(err);
          showError('Error al cargar la información del reporte.');
          navigate('/dashboard');
        } finally {
          setInitLoading(false);
        }
      };
      fetchReport();
    } else {
      setInitLoading(false);
    }
  }, [isEditMode, id, navigate, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!currentUser) {
      showError('Debes iniciar sesión para realizar esta acción.');
      setLoading(false);
      return;
    }

    // Basic validation
    if (!formData.title || !formData.type || !formData.barrio || !formData.description) {
      setError('Por favor completa todos los campos obligatorios.');
      setLoading(false);
      return;
    }

    try {
      if (isEditMode && id) {
        const updatedReport = await supabaseService.updateReport(id, {
          ...formData,
          type: formData.type as ReportType
        }, file, existingImageUrls);
        if (updatedReport) {
          navigate('/mis-aportes');
        }
      } else {
        const newReport = await supabaseService.createReport({
          ...formData,
          type: formData.type as ReportType
        }, file, currentUser);
        if (newReport) {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error al guardar el reporte. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return <div className="p-10 text-center">Cargando información del reporte...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
             <h1 className="text-lg font-bold text-slate-900">{isEditMode ? 'Editar Reporte' : 'Registrar nuevo problema social'}</h1>
             <p className="text-sm text-slate-500">
               {isEditMode ? 'Modifica la información de tu reporte.' : 'Complete el formulario para reportar una incidencia en su comunidad.'}
             </p>
          </div>
          {isEditMode && <Save className="text-blue-600 opacity-20" size={24} />}
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-start">
              <AlertCircle className="text-red-500 mr-3 mt-0.5" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Título del reporte <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ej: Bache peligroso..."
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Tipo de problema <span className="text-red-500">*</span></label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="">Seleccione una categoría</option>
                  {REPORT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {/* Barrio */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Barrio / Ubicación <span className="text-red-500">*</span></label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={formData.barrio}
                  onChange={e => setFormData({...formData, barrio: e.target.value})}
                >
                  <option value="">Seleccione el barrio</option>
                  {BARRIOS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

             {/* Specific Location */}
             <div>
              <label className="block text-sm font-medium text-slate-700">Dirección específica (Opcional)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2"
                  placeholder="Ej: Av. Central y Calle 5"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Descripción <span className="text-red-500">*</span></label>
              <textarea
                rows={4}
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Describa el problema, su impacto y referencias cercanas..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <p className="mt-2 text-xs text-slate-500">Mínimo 20 caracteres. Evite datos personales.</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Adjuntar imágenes (Evidencia)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:bg-slate-50 transition-colors">
                <div className="space-y-1 text-center">
                  <Camera className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>{isEditMode && existingImageUrls.length > 0 && !file ? 'Cambiar archivo' : 'Sube un archivo'}</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0])}
                      />
                    </label>
                    <p className="pl-1">o arrastra y suelta</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {file ? `Seleccionado: ${file.name}` : (isEditMode && existingImageUrls.length > 0 ? "Imagen actual guardada (sube otra para reemplazar)" : "PNG, JPG hasta 5MB")}
                  </p>
                </div>
              </div>
              {isEditMode && existingImageUrls.length > 0 && !file && (
                  <div className="mt-2">
                      <p className="text-xs text-slate-500 mb-1">Imagen actual:</p>
                      <img src={existingImageUrls[0]} alt="Actual" className="h-20 w-20 object-cover rounded-md border" />
                  </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate(isEditMode ? '/mis-aportes' : '/dashboard')}
                className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Reporte' : 'Enviar reporte')}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateReport;