import { supabase } from '@/src/integrations/supabase/client';
import { Report, User, Comment, ReportStatus, ReportType } from '@/types';
import { showSuccess, showError } from '@/src/utils/toast';

const BUCKET_REPORT_IMAGES = 'report_images';
const BUCKET_COMMENT_IMAGES = 'comment_images';

// Helper to get public URL for an image
const getPublicImageUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Helper to upload image
const uploadImage = async (file: File, userId: string, bucket: string): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    showError('Error al subir la imagen.');
    return null;
  }
  return fileName;
};

// Helper to delete image
const deleteImage = async (imageUrl: string, bucket: string): Promise<void> => {
  const path = imageUrl.split(`${bucket}/`)[1];
  if (!path) return;

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error('Error deleting image:', error);
    showError('Error al eliminar la imagen anterior.');
  }
};

class SupabaseBackend {
  async getReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*, profiles(first_name, last_name, avatar_url), comments(*, profiles(first_name, last_name, avatar_url))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      showError('Error al cargar los reportes.');
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
      comments: report.comments.map((comment: any) => ({
        id: comment.id,
        userId: comment.author_id,
        userName: `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      })),
      supportCount: report.support_count,
      supportedBy: report.supported_by || [],
    }));
  }

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
      comments: data.comments.map((comment: any) => ({
        id: comment.id,
        userId: comment.author_id,
        userName: `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      })),
      supportCount: data.support_count,
      supportedBy: data.supported_by || [],
    };
  }

  async getUserReports(userId: string): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*, profiles(first_name, last_name, avatar_url), comments(*)')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reports:', error);
      showError('Error al cargar tus reportes.');
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
      comments: report.comments.map((comment: any) => ({
        id: comment.id,
        userId: comment.author_id,
        userName: 'Usuario Anónimo', // Will be fetched in ReportDetail if needed
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      })),
      supportCount: report.support_count,
      supportedBy: report.supported_by || [],
    }));
  }

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
        return null; // Failed to upload image
      }
    }

    const { data: newReport, error } = await supabase
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
      .select('*, profiles(first_name, last_name, avatar_url), comments(*)')
      .single();

    if (error) {
      console.error('Error creating report:', error);
      showError('Error al crear el reporte.');
      return null;
    }

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
      comments: [],
      supportCount: newReport.support_count,
      supportedBy: newReport.supported_by || [],
    };
  }

  async updateReport(id: string, data: Partial<Report>, file?: File, existingImageUrls?: string[]): Promise<Report | null> {
    let imageUrlsToUpdate: string[] | undefined = existingImageUrls;

    if (file) {
      // If a new file is provided, delete old images and upload new one
      if (existingImageUrls && existingImageUrls.length > 0) {
        await Promise.all(existingImageUrls.map(url => deleteImage(url, BUCKET_REPORT_IMAGES)));
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
        return null; // Failed to upload new image
      }
    } else if (existingImageUrls && existingImageUrls.length === 0) {
      // If no new file and existing images were cleared, set to empty
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

    const { data: updatedReport, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select('*, profiles(first_name, last_name, avatar_url), comments(*)')
      .single();

    if (error) {
      console.error('Error updating report:', error);
      showError('Error al actualizar el reporte.');
      return null;
    }

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
      comments: updatedReport.comments.map((comment: any) => ({
        id: comment.id,
        userId: comment.author_id,
        userName: 'Usuario Anónimo',
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      })),
      supportCount: updatedReport.support_count,
      supportedBy: updatedReport.supported_by || [],
    };
  }

  async deleteReport(id: string): Promise<void> {
    // First, get the report to delete its images
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
      await Promise.all(reportToDelete.image_urls.map((path: string) => deleteImage(getPublicImageUrl(BUCKET_REPORT_IMAGES, path), BUCKET_REPORT_IMAGES)));
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

  // Comments
  async addComment(reportId: string, content: string, file?: File, currentUser?: User): Promise<Comment | null> {
    if (!currentUser) {
      showError('Debes iniciar sesión para comentar.');
      return null;
    }

    let imageUrl: string | undefined;
    if (file) {
      const uploadedPath = await uploadImage(file, currentUser.id, BUCKET_COMMENT_IMAGES);
      if (uploadedPath) {
        imageUrl = uploadedPath;
      } else {
        return null; // Failed to upload image
      }
    }

    const { data: newComment, error } = await supabase
      .from('comments')
      .insert({
        report_id: reportId,
        author_id: currentUser.id,
        content: content,
        image_url: imageUrl,
      })
      .select('*, profiles(first_name, last_name, avatar_url)')
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      showError('Error al añadir el comentario.');
      return null;
    }

    showSuccess('Comentario añadido exitosamente.');
    return {
      id: newComment.id,
      userId: newComment.author_id,
      userName: `${newComment.profiles?.first_name || ''} ${newComment.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
      content: newComment.content,
      imageUrl: newComment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, newComment.image_url) : undefined,
      createdAt: newComment.created_at,
    };
  }

  async getUserComments(userId: string): Promise<{ comment: Comment, reportTitle: string, reportId: string }[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, reports(id, title), profiles(first_name, last_name, avatar_url)')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user comments:', error);
      showError('Error al cargar tus comentarios.');
      return [];
    }

    return data.map(comment => ({
      comment: {
        id: comment.id,
        userId: comment.author_id,
        userName: `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      },
      reportTitle: comment.reports?.title || 'Reporte Desconocido',
      reportId: comment.reports?.id || '',
    }));
  }

  async deleteComment(reportId: string, commentId: string): Promise<void> {
    // First, get the comment to delete its image
    const { data: commentToDelete, error: fetchError } = await supabase
      .from('comments')
      .select('image_url')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      console.error('Error fetching comment for deletion:', fetchError);
      showError('Error al encontrar el comentario para eliminar su imagen.');
      throw fetchError;
    }

    if (commentToDelete && commentToDelete.image_url) {
      await deleteImage(getPublicImageUrl(BUCKET_COMMENT_IMAGES, commentToDelete.image_url), BUCKET_COMMENT_IMAGES);
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('report_id', reportId); // Ensure the comment belongs to the report

    if (error) {
      console.error('Error deleting comment:', error);
      showError('Error al eliminar el comentario.');
      throw error;
    }
    showSuccess('Comentario eliminado exitosamente.');
  }

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

    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        supported_by: newSupportedBy,
        support_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select('*, profiles(first_name, last_name, avatar_url), comments(*)')
      .single();

    if (updateError) {
      console.error('Error updating support:', updateError);
      showError('Error al actualizar el apoyo.');
      return null;
    }

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
      comments: updatedReport.comments.map((comment: any) => ({
        id: comment.id,
        userId: comment.author_id,
        userName: 'Usuario Anónimo',
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      })),
      supportCount: updatedReport.support_count,
      supportedBy: updatedReport.supported_by || [],
    };
  }
}

export const supabaseService = new SupabaseBackend();