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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header user={user} profile={profile} onUserChange={setUser} />
      <ChatWidget user={user} />
    </div>
  );
};

export default Chat;
