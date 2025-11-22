import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/src/integrations/supabase/client';
import { User as AppUser } from '../../types';
import { getPublicImageUrl, BUCKET_AVATARS } from '@/src/services';
import { showError } from '@/src/utils/toast';

interface SessionContextType {
  session: Session | null;
  user: AppUser | null;
  supabaseUser: User | null;
  isLoading: boolean;
  setAppUser: (user: AppUser | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let authListener: any; // Variable para almacenar la suscripción del listener

    const initializeSession = async () => {
      setIsLoading(true); // Iniciar estado de carga

      // 1. Obtener la sesión actual explícitamente
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setSupabaseUser(initialSession?.user || null);

      if (initialSession?.user) {
        // Si hay un usuario, intentar cargar su perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', initialSession.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('SessionContextProvider: Error fetching profile during initial load:', profileError);
          showError(`Error al cargar el perfil de usuario: ${profileError.message}`);
          setAppUser({
            id: initialSession.user.id,
            email: initialSession.user.email || '',
            name: initialSession.user.email || 'Usuario',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(initialSession.user.email || 'Usuario')}&background=2563eb&color=fff`
          });
        } else if (profile) {
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          let avatarUrl: string;
          if (profile.avatar_url && (profile.avatar_url.startsWith('http://') || profile.avatar_url.startsWith('https://'))) {
            avatarUrl = profile.avatar_url;
          } else if (profile.avatar_url) {
            avatarUrl = getPublicImageUrl(BUCKET_AVATARS, profile.avatar_url);
          } else {
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || initialSession.user.email || 'Usuario')}&background=2563eb&color=fff`;
          }
          setAppUser({
            id: initialSession.user.id,
            email: initialSession.user.email || '',
            name: fullName || initialSession.user.email || 'Usuario',
            avatar: avatarUrl
          });
        } else {
          // Fallback si no se encuentra perfil
          setAppUser({
            id: initialSession.user.id,
            email: initialSession.user.email || '',
            name: initialSession.user.email || 'Usuario',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(initialSession.user.email || 'Usuario')}&background=2563eb&color=fff`
          });
        }
      } else {
        setAppUser(null);
      }
      setIsLoading(false); // Finalizar estado de carga después de procesar la sesión inicial

      // 2. Configurar el listener para cambios posteriores en el estado de autenticación
      const { data } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          console.log('SessionContextProvider: Auth state change event (listener):', event);
          console.log('SessionContextProvider: Current session (listener):', currentSession);

          setSession(currentSession);
          setSupabaseUser(currentSession?.user || null);

          if (currentSession?.user) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('first_name, last_name, avatar_url')
              .eq('id', currentSession.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('SessionContextProvider: Error fetching profile during listener event:', profileError);
              showError(`Error al cargar el perfil de usuario: ${profileError.message}`);
              setAppUser({
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                name: currentSession.user.email || 'Usuario',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentSession.user.email || 'Usuario')}&background=2563eb&color=fff`
              });
            } else if (profile) {
              const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
              let avatarUrl: string;
              if (profile.avatar_url && (profile.avatar_url.startsWith('http://') || profile.avatar_url.startsWith('https://'))) {
                avatarUrl = profile.avatar_url;
              } else if (profile.avatar_url) {
                avatarUrl = getPublicImageUrl(BUCKET_AVATARS, profile.avatar_url);
              } else {
                avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || currentSession.user.email || 'Usuario')}&background=2563eb&color=fff`;
              }
              setAppUser({
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                name: fullName || currentSession.user.email || 'Usuario',
                avatar: avatarUrl
              });
            } else {
              setAppUser({
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                name: currentSession.user.email || 'Usuario',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentSession.user.email || 'Usuario')}&background=2563eb&color=fff`
              });
            }
          } else {
            setAppUser(null);
          }
        }
      );
      authListener = data; // Asignar la suscripción a la variable externa
    };

    initializeSession(); // Ejecutar la inicialización al montar el componente

    return () => {
      if (authListener) {
        console.log('SessionContextProvider: Cleaning up auth state listener.');
        authListener.subscription.unsubscribe(); // Limpiar la suscripción al desmontar
      }
    };
  }, []); // El array de dependencias vacío asegura que se ejecute solo una vez al montar

  // Memoizar el valor del contexto para evitar re-renders innecesarios de los consumidores
  const contextValue = useMemo(() => ({
    session,
    user: appUser,
    supabaseUser,
    isLoading,
    setAppUser,
  }), [session, appUser, supabaseUser, isLoading]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};