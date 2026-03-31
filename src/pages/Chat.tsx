import { useState, useEffect } from "react";
import ChatWidget from "@/components/chat/ChatWidget";
import Header from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Chat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for profile changes in real-time
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up profile subscription for user:', user.id);

    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated via real-time:', payload.new);
          setProfile(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Removing profile subscription');
      supabase.removeChannel(profileSubscription);
    };
  }, [user?.id]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const handleProfileChange = (updatedProfile: any) => {
    console.log('Profile changed via callback:', updatedProfile);
    setProfile(updatedProfile);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header 
        user={user} 
        profile={profile} 
        onUserChange={setUser} 
        onProfileChange={handleProfileChange}
      />
      <div className="flex-1 overflow-hidden page-enter">
        <ChatWidget user={user} profile={profile} />
      </div>
    </div>
  );
};

export default Chat;
