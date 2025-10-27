import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Role = 'admin' | 'agent' | 'supervisor';

export const useRoles = (userId?: string) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchRoles = async () => {
      try {
        console.log('Fetching roles for user:', userId);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        console.log('Roles query result:', { data, error });
        
        if (error) throw error;
        const fetchedRoles = data?.map(r => r.role as Role) || [];
        console.log('User roles:', fetchedRoles);
        setRoles(fetchedRoles);
      } catch (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, [userId]);

  const hasRole = (role: Role) => roles.includes(role);
  const isAdmin = hasRole('admin');

  return { roles, isLoading, hasRole, isAdmin };
};
