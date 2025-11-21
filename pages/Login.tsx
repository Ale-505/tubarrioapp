import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/src/integrations/supabase/client';
import { useSession } from '@/src/components/SessionContextProvider';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSession();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Iniciar sesión
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Accede a tu cuenta para reportar y dar seguimiento.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb', // blue-600
                    brandAccent: '#1d4ed8', // blue-700
                  },
                },
              },
            }}
            theme="light"
            redirectTo={window.location.origin + '/#/dashboard'}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;