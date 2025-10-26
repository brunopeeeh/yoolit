import { useState, useEffect } from "react";
import ChatWidget from "@/components/chat/ChatWidget";
import Header from "@/components/layout/Header";

const Chat = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Header user={user} onUserChange={setUser} />
      
      <div className="p-8">
        <ChatWidget user={user} />
      </div>
    </div>
  );
};

export default Chat;
