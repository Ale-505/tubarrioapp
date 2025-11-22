import imageCompression from 'browser-image-compression';
import { showError } from './toast';

/**
 * Comprime un archivo de imagen utilizando browser-image-compression.
 * Configurado para un tamaño máximo de 1MB y una resolución máxima de 1920px.
 * @param file El archivo de imagen a comprimir.
 * @returns El archivo de imagen comprimido o null si falla.
 */
export const compressImage = async (file: File): Promise<File | null> => {
  if (!file) return null;

  const options = {
    maxSizeMB: 1,           // Tamaño máximo del archivo en MB
    maxWidthOrHeight: 1920, // Ancho o alto máximo en píxeles
    useWebWorker: true,     // Usar Web Worker para una compresión más rápida
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Tamaño original: ${file.size / 1024 / 1024} MB`);
    console.log(`Tamaño comprimido: ${compressedFile.size / 1024 / 1024} MB`);
    return compressedFile;
  } catch (error) {
    console.error('Error durante la compresión de la imagen:', error);
    showError('Error al comprimir la imagen antes de subirla.');
    return null;
  }
};