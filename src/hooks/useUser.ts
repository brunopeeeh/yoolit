import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface LocalUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export const useUser = () => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar autenticação e verificar sessão existente
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Verificar se há uma sessão ativa
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.user) {
          const sessionUser = sessionData.session.user;
          // Converter usuário do Supabase para o formato local
          const localUser: LocalUser = {
            id: sessionUser.id,
            name: sessionUser.user_metadata?.name || 
                  sessionUser.user_metadata?.full_name || 
                  sessionUser.email?.split('@')[0] || 'Usuário',
            email: sessionUser.email || '',
            avatar: sessionUser.user_metadata?.avatar_url || 
                   `https://ui-avatars.com/api/?name=${encodeURIComponent(sessionUser.email?.split('@')[0] || 'User')}&background=0d547f&color=fff`
          };
          
          setUser(localUser);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        // Em caso de erro, continuar sem autenticação
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const sessionUser = session.user;
          const localUser: LocalUser = {
            id: sessionUser.id,
            name: sessionUser.user_metadata?.name || 
                  sessionUser.user_metadata?.full_name || 
                  sessionUser.email?.split('@')[0] || 'Usuário',
            email: sessionUser.email || '',
            avatar: sessionUser.user_metadata?.avatar_url || 
                   `https://ui-avatars.com/api/?name=${encodeURIComponent(sessionUser.email?.split('@')[0] || 'User')}&background=0d547f&color=fff`
          };
          setUser(localUser);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
            full_name: name || email.split('@')[0],
          }
        }
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    isLoggedIn: !!user
  };
};