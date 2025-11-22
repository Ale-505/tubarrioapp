import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/src/integrations/supabase/client';
import { User as AppUser } from '../../types'; // Ruta corregida
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
    console.log('SessionContextProvider: Setting up auth state listener');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('SessionContextProvider: Auth state change event:', event);
        console.log('SessionContextProvider: Current session:', currentSession);

        setSession(currentSession);
        setSupabaseUser(currentSession?.user || null);

        if (currentSession?.user) {
          console.log('SessionContextProvider: User found, fetching profile...');
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', currentSession.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error('SessionContextProvider: Error fetching profile:', profileError);
            showError(`Error al cargar el perfil de usuario: ${profileError.message}`);
            setAppUser({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: currentSession.user.email || 'Usuario',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentSession.user.email || 'Usuario')}&background=2563eb&color=fff`
            });
          } else if (profile) {
            console.log('SessionContextProvider: Profile fetched:', profile);
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            let avatarUrl: string;
            if (profile.avatar_url && (profile.avatar_url.startsWith('http://') || profile.avatar_url.startsWith('https://'))) {
              // Si avatar_url ya es una URL completa (como de ui-avatars.com), úsala directamente
              avatarUrl = profile.avatar_url;
            } else if (profile.avatar_url) {
              // De lo contrario, asume que es una ruta dentro de nuestro bucket de Supabase Storage
              avatarUrl = getPublicImageUrl(BUCKET_AVATARS, profile.avatar_url);
            } else {
              // Fallback a ui-avatars.com si no hay avatar_url presente
              avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || currentSession.user.email || 'Usuario')}&background=2563eb&color=fff`;
            }
            setAppUser({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: fullName || currentSession.user.email || 'Usuario',
              avatar: avatarUrl
            });
          } else {
             // Fallback if no profile found (shouldn't happen with trigger, but good for robustness)
             console.log('SessionContextProvider: No profile found, using fallback.');
             setAppUser({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: currentSession.user.email || 'Usuario',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentSession.user.email || 'Usuario')}&background=2563eb&color=fff`
            });
          }
        } else {
          console.log('SessionContextProvider: No user in session, clearing appUser.');
          setAppUser(null);
        }
        console.log('SessionContextProvider: Finished processing auth state change. isLoading = false.');
        setIsLoading(false); // Always set to false after processing an auth state change
      }
    );

    return () => {
      console.log('SessionContextProvider: Cleaning up auth state listener.');
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array means this runs once on mount

  console.log('SessionContextProvider: Render. isLoading:', isLoading, 'appUser:', appUser);

  return (
    <SessionContext.Provider value={{ session, user: appUser, supabaseUser, isLoading, setAppUser }}>
      {children}
    </SessionContext.Provider>
  );
};