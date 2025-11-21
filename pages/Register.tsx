import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/integrations/supabase/client';
import { useSession } from '@/src/components/SessionContextProvider';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${formData.firstName} ${formData.lastName}`)}&background=2563eb&color=fff`
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        navigate('/dashboard'); // Supabase auto-logs in after signup
      } else {
        setError('Registro exitoso. Por favor, revisa tu correo para verificar tu cuenta.');
      }
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Crear cuenta de ciudadano
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Nombre</label>
                    <input 
                        type="text" 
                        required
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Apellido</label>
                    <input 
                        type="text" 
                        required
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                        value={formData.lastName}
                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                    />
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Correo electrónico</label>
              <input 
                type="email" 
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Contraseña</label>
              <input 
                type="password" 
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
            
            <div className="text-sm text-center">
              <span className="text-slate-500">¿Ya tienes cuenta? </span>
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Inicia sesión</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;