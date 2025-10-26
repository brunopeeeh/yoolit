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
    <div className="min-h-screen flex flex-col bg-background">
      <Header user={user} onUserChange={setUser} />
      <ChatWidget user={user} />
    </div>
  );
};

export default Chat;
