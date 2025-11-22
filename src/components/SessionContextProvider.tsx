import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/src/integrations/supabase/client';
import { User as AppUser } from '../types';
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
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setSupabaseUser(currentSession?.user || null);

        if (currentSession?.user) {
          // Fetch profile data from public.profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', currentSession.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
            showError(`Error al cargar el perfil de usuario: ${profileError.message}`);
            setAppUser({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: currentSession.user.email || 'Usuario',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentSession.user.email || 'Usuario')}&background=2563eb&color=fff`
            });
          } else if (profile) {
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            const avatarUrl = profile.avatar_url ? getPublicImageUrl(BUCKET_AVATARS, profile.avatar_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || currentSession.user.email || 'Usuario')}&background=2563eb&color=fff`;
            setAppUser({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: fullName || currentSession.user.email || 'Usuario',
              avatar: avatarUrl
            });
          } else {
             // Fallback if no profile found (shouldn't happen with trigger, but good for robustness)
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
        setIsLoading(false); // Always set to false after processing an auth state change
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array means this runs once on mount

  return (
    <SessionContext.Provider value={{ session, user: appUser, supabaseUser, isLoading, setAppUser }}>
      {children}
    </SessionContext.Provider>
  );
};