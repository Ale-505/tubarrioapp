import React from 'react';
import { ReportStatus } from '../types';

const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const styles = {
    'Abierto': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'En proceso': 'bg-blue-100 text-blue-800 border-blue-200',
    'Resuelto': 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles['Abierto']}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Abierto' ? 'bg-yellow-500' : status === 'Resuelto' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;