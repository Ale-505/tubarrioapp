export interface User {
  id: string;
  email: string;
  name: string; // This will be derived from first_name/last_name or user_metadata
  avatar?: string; // This will be derived from avatar_url in profiles or user_metadata
}

export type ReportStatus = 'Abierto' | 'En proceso' | 'Resuelto';
export type ReportType = 'Vialidad' | 'Alumbrado' | 'Basura' | 'Seguridad' | 'Áreas verdes' | 'Otro';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string; // Nuevo campo para la URL del avatar del usuario
  content: string;
  imageUrl?: string;
  createdAt: string;
  isSystem?: boolean;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  barrio: string;
  status: ReportStatus;
  location: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  images: string[];
  comments: Comment[];
  supportCount: number;
  supportedBy: string[]; // Array of user IDs who supported this report
}

export interface FilterState {
  keyword: string;
  barrio: string;
  type: string;
}