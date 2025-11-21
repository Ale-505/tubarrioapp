import { supabase } from '@/src/integrations/supabase/client';
import { Report, User, ReportStatus, ReportType } from '@/types';
import { showSuccess, showError } from '@/src/utils/toast';
import { uploadImage, deleteImage, getPublicImageUrl, BUCKET_REPORT_IMAGES, BUCKET_COMMENT_IMAGES } from './storageService';

class ReportService {
  /**
   * Obtiene todos los reportes con información de autor y comentarios.
   * @returns Un array de reportes.
   */
  async getReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*') // Simplificado para diagnosticar
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      showError('Error al cargar los reportes.');
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map(report => ({
      id: report.id,
      title: report.title,
      description: report.description,
      type: report.type as ReportType,
      barrio: report.barrio,
      status: report.status as ReportStatus,
      location: report.location || '',
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      authorId: report.author_id,
      authorName: 'Usuario Anónimo', // Valor predeterminado temporal
      images: report.image_urls ? report.image_urls.map((path: string) => getPublicImageUrl(BUCKET_REPORT_IMAGES, path)) : [],
      comments: [], // Vacío temporalmente
      supportCount: report.support_count,
      supportedBy: report.supported_by || [],
    }));
  }

  /**
   * Obtiene un reporte por su ID.
   * @param id El ID del reporte.
   * @returns El reporte encontrado o undefined.
   */
  async getReportById(id: string): Promise<Report | undefined> {
    const { data, error } = await supabase
      .from('reports')
      .select('*, profiles(first_name, last_name, avatar_url), comments(*, profiles(first_name, last_name, avatar_url))')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching report by ID:', error);
      showError('Error al cargar el reporte.');
      return undefined;
    }

    if (!data) return undefined;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type as ReportType,
      barrio: data.barrio,
      status: data.status as ReportStatus,
      location: data.location || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      authorId: data.author_id,
      authorName: `${data.profiles?.first_name || ''} ${data.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
      images: data.image_urls ? data.image_urls.map((path: string) => getPublicImageUrl(BUCKET_REPORT_IMAGES, path)) : [],
      comments: data.comments ? data.comments.map((comment: any) => ({
        id: comment.id,
        userId: comment.author_id,
        userName: `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      })) : [],
      supportCount: data.support_count,
      supportedBy: data.supported_by || [],
    };
  }

  /**
   * Obtiene los reportes creados por un usuario específico.
   * @param userId El ID del usuario.
   * @returns Un array de reportes del usuario.
   */
  async getUserReports(userId: string): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*, profiles(first_name, last_name, avatar_url), comments(*, profiles(first_name, last_name, avatar_url))') // Incluir perfiles para comentarios
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reports:', error);
      showError('Error al cargar tus reportes.');
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map(report => ({
      id: report.id,
      title: report.title,
      description: report.description,
      type: report.type as ReportType,
      barrio: report.barrio,
      status: report.status as ReportStatus,
      location: report.location || '',
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      authorId: report.author_id,
      authorName: `${report.profiles?.first_name || ''} ${report.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
      images: report.image_urls ? report.image_urls.map((path: string) => getPublicImageUrl(BUCKET_REPORT_IMAGES, path)) : [],
      comments: report.comments ? report.comments.map((comment: any) => ({
        id: comment.id,
        userId: comment.author_id,
        userName: `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo', // Usar datos del perfil
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      })) : [],
      supportCount: report.support_count,
      supportedBy: report.supported_by || [],
    }));
  }

  /**
   * Crea un nuevo reporte.
   * @param data Los datos parciales del reporte.
   * @param file La imagen adjunta (opcional).
   * @param currentUser El usuario actual.
   * @returns El reporte creado o null si falla.
   */
  async createReport(data: Partial<Report>, file?: File, currentUser?: User): Promise<Report | null> {
    if (!currentUser) {
      showError('Debes iniciar sesión para crear un reporte.');
      return null;
    }

    let imageUrls: string[] = [];
    if (file) {
      const uploadedPath = await uploadImage(file, currentUser.id, BUCKET_REPORT_IMAGES);
      if (uploadedPath) {
        imageUrls.push(uploadedPath);
      } else {
        return null;
      }
    }

    const { data: newReports, error } = await supabase
      .from('reports')
      .insert({
        author_id: currentUser.id,
        title: data.title,
        description: data.description,
        type: data.type,
        barrio: data.barrio,
        status: 'Abierto',
        location: data.location,
        image_urls: imageUrls,
        support_count: 0,
        supported_by: [],
      })
      .select('*, profiles(first_name, last_name, avatar_url), comments(*, profiles(first_name, last_name, avatar_url))') // Incluir perfiles para comentarios
      ;

    if (error) {
      console.error('Error creating report:', error);
      showError('Error al crear el reporte.');
      return null;
    }

    if (!newReports || newReports.length === 0) {
      showError('Error al crear el reporte: No se devolvieron datos.');
      return null;
    }

    const newReport = newReports[0];

    showSuccess('Reporte creado exitosamente.');
    return {
      id: newReport.id,
      title: newReport.title,
      description: newReport.description,
      type: newReport.type as ReportType,
      barrio: newReport.barrio,
      status: newReport.status as ReportStatus,
      location: newReport.location || '',
      createdAt: newReport.created_at,
      updatedAt: newReport.updated_at,
      authorId: newReport.author_id,
      authorName: `${newReport.profiles?.first_name || ''} ${newReport.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
      images: newReport.image_urls ? newReport.image_urls.map((path: string) => getPublicImageUrl(BUCKET_REPORT_IMAGES, path)) : [],
      comments: newReport.comments ? newReport.comments.map((comment: any) => ({
        id: comment.id,
        userId: comment.author_id,
        userName: `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo', // Usar datos del perfil
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      })) : [],
      supportCount: newReport.support_count,
      supportedBy: newReport.supported_by || [],
    };
  }

  /**
   * Actualiza un reporte existente.
   * @param id El ID del reporte a actualizar.
   * @param data Los datos parciales del reporte.
   * @param file La nueva imagen adjunta (opcional).
   * @param existingImageUrls Las URLs de las imágenes existentes.
   * @returns El reporte actualizado o null si falla.
   */
  async updateReport(id: string, data: Partial<Report>, file?: File, existingImageUrls?: string[]): Promise<Report | null> {
    let imageUrlsToUpdate: string[] | undefined = existingImageUrls;

    if (file) {
      if (existingImageUrls && existingImageUrls.length > 0) {
        await Promise.all(existingImageUrls.map(url => {
          const path = url.split(`${BUCKET_REPORT_IMAGES}/`)[1];
          return deleteImage(path, BUCKET_REPORT_IMAGES);
        }));
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('No autorizado para subir imágenes.');
        return null;
      }
      const uploadedPath = await uploadImage(file, user.id, BUCKET_REPORT_IMAGES);
      if (uploadedPath) {
        imageUrlsToUpdate = [uploadedPath];
      } else {
        return null;
      }
    } else if (existingImageUrls && existingImageUrls.length === 0) {
      imageUrlsToUpdate = [];
    }

    const updateData: any = {
      title: data.title,
      description: data.description,
      type: data.type,
      barrio: data.barrio,
      location: data.location,
      updated_at: new Date().toISOString(),
    };

    if (data.status) {
      updateData.status = data.status;
    }
    if (imageUrlsToUpdate !== undefined) {
      updateData.image_urls = imageUrlsToUpdate;
    }

    const { data: updatedReports, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select('*, profiles(first_name, last_name, avatar_url), comments(*, profiles(first_name, last_name, avatar_url))') // Incluir perfiles para comentarios
      ;

    if (error) {
      console.error('Error updating report:', error);
      showError('Error al actualizar el reporte.');
      return null;
    }

    if (!updatedReports || updatedReports.length === 0) {
      showError('Error al actualizar el reporte: No se devolvieron datos.');
      return null;
    }

    const updatedReport = updatedReports[0];

    showSuccess('Reporte actualizado exitosamente.');
    return {
      id: updatedReport.id,
      title: updatedReport.title,
      description: updatedReport.description,
      type: updatedReport.type as ReportType,
      barrio: updatedReport.barrio,
      status: updatedReport.status as ReportStatus,
      location: updatedReport.location || '',
      createdAt: updatedReport.created_at,
      updatedAt: updatedReport.updated_at,
      authorId: updatedReport.author_id,
      authorName: `${updatedReport.profiles?.first_name || ''} ${updatedReport.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
      images: updatedReport.image_urls ? updatedReport.image_urls.map((path: string) => getPublicImageUrl(BUCKET_REPORT_IMAGES, path)) : [],
      comments: updatedReport.comments ? updatedReport.comments.map((comment: any) => ({
        id: comment.id,
        userId: comment.author_id,
        userName: `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo', // Usar datos del perfil
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      })) : [],
      supportCount: updatedReport.support_count,
      supportedBy: updatedReport.supported_by || [],
    };
  }

  /**
   * Elimina un reporte por su ID.
   * @param id El ID del reporte a eliminar.
   */
  async deleteReport(id: string): Promise<void> {
    const { data: reportToDelete, error: fetchError } = await supabase
      .from('reports')
      .select('image_urls')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching report for deletion:', fetchError);
      showError('Error al encontrar el reporte para eliminar sus imágenes.');
      throw fetchError;
    }

    if (reportToDelete && reportToDelete.image_urls && reportToDelete.image_urls.length > 0) {
      await Promise.all(reportToDelete.image_urls.map((path: string) => deleteImage(path, BUCKET_REPORT_IMAGES)));
    }

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting report:', error);
      showError('Error al eliminar el reporte.');
      throw error;
    }
    showSuccess('Reporte eliminado exitosamente.');
  }

  /**
   * Alterna el estado de apoyo de un reporte por un usuario.
   * @param reportId El ID del reporte.
   * @param userId El ID del usuario.
   * @returns El reporte actualizado o null si falla.
   */
  async toggleSupport(reportId: string, userId: string): Promise<Report | null> {
    const { data: currentReport, error: fetchError } = await supabase
      .from('reports')
      .select('supported_by, support_count')
      .eq('id', reportId)
      .single();

    if (fetchError || !currentReport) {
      console.error('Error fetching report for support toggle:', fetchError);
      showError('Error al obtener el reporte para apoyar.');
      return null;
    }

    let newSupportedBy = currentReport.supported_by || [];
    let newCount = currentReport.support_count;
    const alreadySupported = newSupportedBy.includes(userId);

    if (alreadySupported) {
      newSupportedBy = newSupportedBy.filter((id: string) => id !== userId);
      newCount = Math.max(0, newCount - 1);
      showSuccess('Apoyo retirado.');
    } else {
      newSupportedBy = [...newSupportedBy, userId];
      newCount = newCount + 1;
      showSuccess('Reporte apoyado.');
    }

    const { data: updatedReports, error: updateError } = await supabase
      .from('reports')
      .update({
        supported_by: newSupportedBy,
        support_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select('*, profiles(first_name, last_name, avatar_url), comments(*, profiles(first_name, last_name, avatar_url))') // Incluir perfiles para comentarios
      ;

    if (updateError) {
      console.error('Error updating support:', updateError);
      showError('Error al actualizar el apoyo.');
      return null;
    }

    if (!updatedReports || updatedReports.length === 0) {
      showError('Error al actualizar el apoyo: No se devolvieron datos.');
      return null;
    }

    const updatedReport = updatedReports[0];

    return {
      id: updatedReport.id,
      title: updatedReport.title,
      description: updatedReport.description,
      type: updatedReport.type as ReportType,
      barrio: updatedReport.barrio,
      status: updatedReport.status as ReportStatus,
      location: updatedReport.location || '',
      createdAt: updatedReport.created_at,
      updatedAt: updatedReport.updated_at,
      authorId: updatedReport.author_id,
      authorName: `${updatedReport.profiles?.first_name || ''} ${updatedReport.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
      images: updatedReport.image_urls ? updatedReport.image_urls.map((path: string) => getPublicImageUrl(BUCKET_REPORT_IMAGES, path)) : [],
      comments: updatedReport.comments ? updatedReport.comments.map((comment: any) => ({
        id: comment.id,
        userId: comment.author_id,
        userName: `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo', // Usar datos del perfil
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      })) : [],
      supportCount: updatedReport.support_count,
      supportedBy: updatedReport.supported_by || [],
    };
  }
}

export const reportService = new ReportService();