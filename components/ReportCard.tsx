import React from 'react';
import { Report } from '../types';
import { Calendar, MapPin, MessageCircle, ThumbsUp } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useNavigate } from 'react-router-dom';

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const navigate = useNavigate();

  const formattedDate = new Date(report.createdAt).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div 
      onClick={() => navigate(`/reporte/${report.id}`)}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full group"
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-3">
          <StatusBadge status={report.status} />
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar size={12} /> {formattedDate}
          </span>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
          {report.title}
        </h3>
        
        <p className="text-slate-600 text-sm mb-4 line-clamp-2 h-10">
          {report.description}
        </p>

        <div className="flex items-center gap-2 mb-4">
           <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-600 font-medium">
             {report.type}
           </span>
           <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-600 font-medium truncate max-w-[150px]">
             <MapPin size={10} className="mr-1"/> {report.barrio}
           </span>
        </div>
      </div>

      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 hover:text-blue-600">
            <ThumbsUp size={16} /> {report.supportCount}
          </span>
          <span className="flex items-center gap-1 hover:text-blue-600">
            <MessageCircle size={16} /> {report.comments.length}
          </span>
        </div>
        <span className="text-xs font-medium text-blue-600">Ver detalle &rarr;</span>
      </div>
    </div>
  );
};

export default ReportCard;