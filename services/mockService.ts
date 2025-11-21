import { Report, User, Comment } from '../types';

// Initial Seed Data
const INITIAL_REPORTS: Report[] = [
  {
    id: 'rep-001',
    title: 'Bache peligroso frente a escuela primaria',
    description: 'Hay un bache de aproximadamente 1 metro de diámetro frente a la Escuela Benito Juárez. Representa riesgo para peatones y vehículos.',
    type: 'Vialidad',
    barrio: 'Col. Centro',
    status: 'Abierto',
    location: 'Av. Juárez 120',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    authorId: 'user-002',
    authorName: 'Ana García',
    images: ['https://picsum.photos/800/600?random=1'],
    supportCount: 12,
    supportedBy: [],
    comments: [
      {
        id: 'c-1',
        userId: 'user-003',
        userName: 'Carlos Ruiz',
        content: 'Es verdad, ayer casi caigo en él.',
        createdAt: new Date(Date.now() - 40000000).toISOString()
      }
    ]
  },
  {
    id: 'rep-002',
    title: 'Foco quemado en parque principal',
    description: 'La luminaria de la esquina noreste del parque no enciende desde hace una semana. La zona está muy oscura.',
    type: 'Alumbrado',
    barrio: 'Las Flores',
    status: 'En proceso',
    location: 'Parque Las Flores',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    authorId: 'user-002',
    authorName: 'Roberto Diaz',
    images: ['https://picsum.photos/800/600?random=2'],
    supportCount: 5,
    supportedBy: [],
    comments: []
  },
  {
    id: 'rep-003',
    title: 'Acumulación de basura en esquina',
    description: 'Vecinos de otra colonia vienen a dejar bolsas de basura en la esquina de Av. Norte.',
    type: 'Basura',
    barrio: 'Parque Norte',
    status: 'Resuelto',
    location: 'Esq. Av. Norte y Calle 5',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    authorId: 'user-001',
    authorName: 'Demo User',
    images: ['https://picsum.photos/800/600?random=3'],
    supportCount: 21,
    supportedBy: [],
    comments: []
  }
];

// In-memory store simulating database
class MockBackend {
  private reports: Report[] = INITIAL_REPORTS;
  // Auth methods removed, now handled by Supabase
  // private users: User[] = [];
  // private currentUser: User | null = null;

  // Reports
  async getReports(): Promise<Report[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getReportById(id: string): Promise<Report | undefined> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.reports.find(r => r.id === id);
  }

  async getUserReports(userId: string): Promise<Report[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return this.reports.filter(r => r.authorId === userId);
  }

  async createReport(data: Partial<Report>, file?: File): Promise<Report> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // This mock service will need to be updated to get the current user from Supabase context
    // For now, it will use a placeholder or assume user is available from a different source
    const mockCurrentUser = { id: 'mock-user-id', name: 'Mock User' }; // Placeholder

    const newReport: Report = {
      id: `rep-${Date.now()}`,
      title: data.title || 'Sin título',
      description: data.description || '',
      type: data.type as any,
      barrio: data.barrio || 'Desconocido',
      status: 'Abierto',
      location: data.location || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: mockCurrentUser.id, // Use mock user
      authorName: mockCurrentUser.name, // Use mock user
      images: file ? [URL.createObjectURL(file)] : (data.images || []),
      comments: [],
      supportCount: 0,
      supportedBy: []
    };

    this.reports = [newReport, ...this.reports];
    return newReport;
  }

  async updateReport(id: string, data: Partial<Report>, file?: File): Promise<Report> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const index = this.reports.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Reporte no encontrado");

    // Mock Image Update: if file provided, replace images, else keep existing
    const updatedImages = file ? [URL.createObjectURL(file)] : this.reports[index].images;

    const updatedReport = {
      ...this.reports[index],
      ...data,
      images: updatedImages,
      updatedAt: new Date().toISOString()
    };

    this.reports[index] = updatedReport;
    return updatedReport;
  }

  async deleteReport(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 600));
    this.reports = this.reports.filter(r => r.id !== id);
  }

  // Comments
  async addComment(reportId: string, text: string, file?: File): Promise<Comment> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const reportIndex = this.reports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) throw new Error("Report not found");

    const mockCurrentUser = { id: 'mock-user-id', name: 'Mock User' }; // Placeholder

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      userId: mockCurrentUser.id, // Use mock user
      userName: mockCurrentUser.name, // Use mock user
      content: text,
      imageUrl: file ? URL.createObjectURL(file) : undefined,
      createdAt: new Date().toISOString()
    };

    this.reports[reportIndex].comments.push(newComment);
    return newComment;
  }

  async getUserComments(userId: string): Promise<{comment: Comment, reportTitle: string, reportId: string}[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const userComments: {comment: Comment, reportTitle: string, reportId: string}[] = [];
    
    this.reports.forEach(report => {
      report.comments.forEach(comment => {
        if (comment.userId === userId) {
          userComments.push({
            comment,
            reportTitle: report.title,
            reportId: report.id
          });
        }
      });
    });
    
    return userComments;
  }

  async deleteComment(reportId: string, commentId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const reportIndex = this.reports.findIndex(r => r.id === reportId);
    if (reportIndex > -1) {
      this.reports[reportIndex].comments = this.reports[reportIndex].comments.filter(c => c.id !== commentId);
    }
  }
  
  async toggleSupport(reportId: string, userId: string): Promise<Report> {
     await new Promise(resolve => setTimeout(resolve, 200));
     const reportIndex = this.reports.findIndex(r => r.id === reportId);
     
     if (reportIndex === -1) throw new Error("Reporte no encontrado");
     
     const report = this.reports[reportIndex];
     const alreadySupported = report.supportedBy?.includes(userId);
     
     let newSupportedBy = report.supportedBy || [];
     let newCount = report.supportCount;

     if (alreadySupported) {
         // Remove support
         newSupportedBy = newSupportedBy.filter(id => id !== userId);
         newCount = Math.max(0, newCount - 1);
     } else {
         // Add support
         newSupportedBy = [...newSupportedBy, userId];
         newCount = newCount + 1;
     }

     const updatedReport = {
         ...report,
         supportCount: newCount,
         supportedBy: newSupportedBy
     };

     this.reports[reportIndex] = updatedReport;
     return updatedReport;
  }
}

export const api = new MockBackend();