import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, LogOut, Menu, X, PlusCircle, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/mockService';

interface NavbarProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    api.logout().then(() => {
      setUser(null);
      navigate('/');
    });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate(user ? '/dashboard' : '/')}>
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <MapPin size={20} />
              </div>
              <span className="ml-2 text-xl font-bold text-slate-800">TuBarrio</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard size={18}/>
                    Reportes
                  </div>
                </Link>
                <Link 
                   to="/crear-reporte" 
                   className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <PlusCircle size={18} />
                  Nuevo Reporte
                </Link>
                
                <div className="ml-4 flex items-center border-l border-slate-200 pl-4">
                  <Link to="/mis-aportes" className={`flex items-center gap-2 mr-4 px-3 py-2 rounded-md transition-colors ${isActive('/mis-aportes') ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                     <img 
                        className="h-8 w-8 rounded-full border border-slate-200" 
                        src={user.avatar} 
                        alt={user.name} 
                      />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</span>
                        <span className="text-xs text-slate-500">Mis Aportes</span>
                      </div>
                  </Link>
                  
                  <button 
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                    title="Cerrar Sesión"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
               <div className="flex items-center space-x-4">
                 <Link to="/login" className="text-slate-600 hover:text-blue-600 font-medium">Iniciar Sesión</Link>
                 <Link to="/registro" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">Regístrate</Link>
               </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-slate-900">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <div className="flex items-center px-3 py-3 border-b border-slate-100 mb-2">
                    <img className="h-8 w-8 rounded-full" src={user.avatar} alt="" />
                    <div className="ml-3">
                      <div className="text-base font-medium text-slate-800">{user.name}</div>
                      <div className="text-sm font-medium text-slate-500">{user.email}</div>
                    </div>
                </div>
                <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50">Explorar Reportes</Link>
                <Link to="/crear-reporte" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50">Crear Reporte</Link>
                <Link to="/mis-aportes" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50">Mis Aportes</Link>
                <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">Cerrar Sesión</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-600">Iniciar Sesión</Link>
                <Link to="/registro" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 bg-blue-50">Regístrate</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;