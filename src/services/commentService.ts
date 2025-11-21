import { supabase } from '@/src/integrations/supabase/client';
import { Comment, User } from '@/types';
import { showSuccess, showError } from '@/src/utils/toast';
import { uploadImage, deleteImage, getPublicImageUrl, BUCKET_COMMENT_IMAGES } from './storageService';

class CommentService {
  /**
   * Añade un nuevo comentario a un reporte.
   * @param reportId El ID del reporte al que se añade el comentario.
   * @param content El contenido del comentario.
   * @param file La imagen adjunta al comentario (opcional).
   * @param currentUser El usuario actual.
   * @returns El comentario creado o null si falla.
   */
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
        return null;
      }
    }

    const { data: newComments, error } = await supabase
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
      id: newComments.id,
      userId: newComments.author_id,
      userName: `${newComments.profiles?.first_name || ''} ${newComments.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
      content: newComments.content,
      imageUrl: newComments.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, newComments.image_url) : undefined,
      createdAt: newComments.created_at,
    };
  }

  /**
   * Obtiene todos los comentarios de un usuario.
   * @param userId El ID del usuario.
   * @returns Un array de objetos que contienen el comentario, el título del reporte y el ID del reporte.
   */
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

    if (!data) {
      return [];
    }

    return data.map(comment => ({
      comment: {
        id: comment.id,
        userId: comment.author_id,
        userName: `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo', // Usar datos del perfil
        content: comment.content,
        imageUrl: comment.image_url ? getPublicImageUrl(BUCKET_COMMENT_IMAGES, comment.image_url) : undefined,
        createdAt: comment.created_at,
      },
      reportTitle: comment.reports?.title || 'Reporte Desconocido',
      reportId: comment.reports?.id || '',
    }));
  }

  /**
   * Elimina un comentario.
   * @param reportId El ID del reporte al que pertenece el comentario.
   * @param commentId El ID del comentario a eliminar.
   */
  async deleteComment(reportId: string, commentId: string): Promise<void> {
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
      await deleteImage(commentToDelete.image_url, BUCKET_COMMENT_IMAGES);
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('report_id', reportId);

    if (error) {
      console.error('Error deleting comment:', error);
      showError('Error al eliminar el comentario.');
      throw error;
    }
    showSuccess('Comentario eliminado exitosamente.');
  }
}

export const commentService = new CommentService();