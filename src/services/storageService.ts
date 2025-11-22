import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '@/src/utils/toast';
import { compressImage } from '@/src/utils/imageCompression'; // Importar la utilidad de compresión

export const BUCKET_REPORT_IMAGES = 'report_images';
export const BUCKET_COMMENT_IMAGES = 'comment_images';
export const BUCKET_AVATARS = 'avatars';

/**
 * Obtiene la URL pública de una imagen desde un bucket de Supabase Storage.
 * @param bucket El nombre del bucket (ej. 'report_images', 'comment_images', 'avatars').
 * @param path La ruta del archivo dentro del bucket (ej. 'userId/timestamp.ext').
 * @returns La URL pública de la imagen.
 */
export const getPublicImageUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Sube un archivo de imagen a un bucket de Supabase Storage.
 * Antes de subir, la imagen será comprimida para optimizar el rendimiento.
 * @param file El archivo de imagen a subir.
 * @param userId El ID del usuario, usado para organizar las imágenes.
 * @param bucket El nombre del bucket de destino.
 * @returns La ruta del archivo subido dentro del bucket, o null si falla.
 */
export const uploadImage = async (file: File, userId: string, bucket: string): Promise<string | null> => {
  if (!file) return null;

  // Comprimir la imagen antes de subirla
  const compressedFile = await compressImage(file);
  if (!compressedFile) {
    return null; // Si hay un error al comprimir, la función compressImage ya mostró un toast.
  }

  const fileExt = compressedFile.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, compressedFile, { // Subir el archivo comprimido
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

/**
 * Elimina un archivo de imagen de un bucket de Supabase Storage.
 * @param path La ruta del archivo dentro del bucket (ej. 'userId/timestamp.ext').
 * @param bucket El nombre del bucket de origen.
 */
export const deleteImage = async (path: string, bucket: string): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error('Error deleting image:', error);
    showError('Error al eliminar la imagen anterior.');
  }
};