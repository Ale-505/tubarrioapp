import { supabase } from '@/src/integrations/supabase/client';
import { Report, User, ReportStatus, ReportType, Comment } from '@/types';
import { showSuccess, showError } from '@/src/utils/toast';
import { uploadImage, deleteImage, getPublicImageUrl, BUCKET_REPORT_IMAGES, BUCKET_COMMENT_IMAGES, BUCKET_AVATARS } from './storageService';

class ReportService {

  // Función auxiliar para obtener un perfil de usuario
  private async getProfile(userId: string): Promise<{ first_name: string; last_name: string; avatar_url: string | null } | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  }

  // Función auxiliar para obtener comentarios de un reporte
  private async getReportComments(reportId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(*)') // Seleccionar todos los campos del perfil
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments for report:', error);
      return [];
    }

    return data.map((comment: any) => ({
      id: comment.id,
      userId: comment.author_id,
      userName: `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
      userAvatar: comment.profiles?.avatar_url ? getPublicImageUrl(BUCKET_AVATARS, comment.profiles.avatar_url) : undefined, // Incluir avatar
      content: comment.content,
      imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
      createdAt: comment.created_at,
    }));
  }

  /**
   * Obtiene un reporte por su ID y lo hidrata con información de autor y comentarios.
   * @param id El ID del reporte.
   * @returns El reporte encontrado o undefined.
   */
  async getReportById(id: string): Promise<Report | undefined> {
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (reportError) {
      console.error('Error fetching report by ID:', reportError);
      showError('Error al cargar el reporte.');
      return undefined;
    }

    if (!reportData) return undefined;

    const authorProfile = await this.getProfile(reportData.author_id);
    const comments = await this.getReportComments(reportData.id);

    return {
      id: reportData.id,
      title: reportData.title,
      description: reportData.description,
      type: reportData.type as ReportType,
      barrio: reportData.barrio,
      status: reportData.status as ReportStatus,
      location: reportData.location || '',
      createdAt: reportData.created_at,
      updatedAt: reportData.updated_at,
      authorId: reportData.author_id,
      authorName: `${authorProfile?.first_name || ''} ${authorProfile?.last_name || ''}`.trim() || 'Usuario Anónimo',
      images: reportData.image_urls ? reportData.image_urls.map((path: string) => getPublicImageUrl(BUCKET_REPORT_IMAGES, path)) : [],
      comments: comments,
      supportCount: reportData.support_count,
      supportedBy: reportData.supported_by || [],
      commentCount: comments.length, // Se calcula aquí para el detalle
    };
  }

  /**
   * Obtiene todos los reportes con información de autor y conteo de comentarios.
   * @returns Un array de reportes.
   */
  async getReports(): Promise<Report[]> {
    const { data: reportsData, error } = await supabase
      .from('reports')
      .select('*, comment_count:comments(count)') // Seleccionar el conteo de comentarios
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      showError('Error al cargar los reportes.');
      return [];
    }

    if (!reportsData) {
      return [];
    }

    // Fetch all unique author profiles in parallel for efficiency
    const uniqueAuthorIds = [...new Set(reportsData.map(r => r.author_id))];
    const profilesPromises = uniqueAuthorIds.map(id => this.getProfile(id));
    const allProfiles = await Promise.all(profilesPromises);
    const profilesMap = new Map(uniqueAuthorIds.map((id, index) => [id, allProfiles[index]]));

    return reportsData.map((reportData: any) => { // Usar 'any' temporalmente para el conteo
      const authorProfile = profilesMap.get(reportData.author_id);
      const commentCount = reportData.comment_count?.[0]?.count || 0; // Extraer el conteo

      return {
        id: reportData.id,
        title: reportData.title,
        description: reportData.description,
        type: reportData.type as ReportType,
        barrio: reportData.barrio,
        status: reportData.status as ReportStatus,
        location: reportData.location || '',
        createdAt: reportData.created_at,
        updatedAt: reportData.updated_at,
        authorId: reportData.author_id,
        authorName: `${authorProfile?.first_name || ''} ${authorProfile?.last_name || ''}`.trim() || 'Usuario Anónimo',
        images: reportData.image_urls ? reportData.image_urls.map((path: string) => getPublicImageUrl(BUCKET_REPORT_IMAGES, path)) : [],
        comments: [], // No se cargan los comentarios completos aquí
        supportCount: reportData.support_count,
        supportedBy: reportData.supported_by || [],
        commentCount: commentCount,
      };
    });
  }

  /**
   * Obtiene los reportes creados por un usuario específico con conteo de comentarios.
   * @param userId El ID del usuario.
   * @returns Un array de reportes del usuario.
   */
  async getUserReports(userId: string): Promise<Report[]> {
    const { data: reportsData, error } = await supabase
      .from('reports')
      .select('*, comment_count:comments(count)') // Seleccionar el conteo de comentarios
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reports:', error);
      showError('Error al cargar tus reportes.');
      return [];
    }

    if (!reportsData) {
      return [];
    }

    // The author is the current user, so we can get their profile once
    const authorProfile = await this.getProfile(userId);
    const authorName = `${authorProfile?.first_name || ''} ${authorProfile?.last_name || ''}`.trim() || 'Usuario Anónimo';

    return reportsData.map((reportData: any) => { // Usar 'any' temporalmente para el conteo
      const commentCount = reportData.comment_count?.[0]?.count || 0; // Extraer el conteo
      return {
        id: reportData.id,
        title: reportData.title,
        description: reportData.description,
        type: reportData.type as ReportType,
        barrio: reportData.barrio,
        status: reportData.status as ReportStatus,
        location: reportData.location || '',
        createdAt: reportData.created_at,
        updatedAt: reportData.updated_at,
        authorId: reportData.author_id,
        authorName: authorName,
        images: reportData.image_urls ? reportData.image_urls.map((path: string) => getPublicImageUrl(BUCKET_REPORT_IMAGES, path)) : [],
        comments: [], // No se cargan los comentarios completos aquí
        supportCount: reportData.support_count,
        supportedBy: reportData.supported_by || [],
        commentCount: commentCount,
      };
    });
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

    const { data: newReportData, error } = await supabase
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
      .select('*')
      .single();

    if (error) {
      console.error('Error creating report:', error);
      showError('Error al crear el reporte.');
      return null;
    }

    if (!newReportData) {
      showError('Error al crear el reporte: No se devolvieron datos.');
      return null;
    }

    showSuccess('Reporte creado exitosamente.');
    return this.getReportById(newReportData.id); // Obtener el reporte completamente hidratado
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

    const { data: updatedReportData, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating report:', error);
      showError('Error al actualizar el reporte.');
      return null;
    }

    if (!updatedReportData) {
      showError('Error al actualizar el reporte: No se devolvieron datos.');
      return null;
    }

    showSuccess('Reporte actualizado exitosamente.');
    return this.getReportById(updatedReportData.id); // Obtener el reporte completamente hidratado
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

    const { data: updatedReportData, error: updateError } = await supabase
      .from('reports')
      .update({
        supported_by: newSupportedBy,
        support_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating support:', updateError);
      showError('Error al actualizar el apoyo.');
      return null;
    }

    if (!updatedReportData) {
      showError('Error al actualizar el apoyo: No se devolvieron datos.');
      return null;
    }

    return this.getReportById(updatedReportData.id); // Obtener el reporte completamente hidratado
  }
}

export const reportService = new ReportService();