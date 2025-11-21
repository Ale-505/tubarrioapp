export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  password?: string; // Only for mock service simulation
}

export type ReportStatus = 'Abierto' | 'En proceso' | 'Resuelto';
export type ReportType = 'Vialidad' | 'Alumbrado' | 'Basura' | 'Seguridad' | 'Áreas verdes' | 'Otro';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
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