import { useState } from "react";
import ChatWidget from "@/components/chat/ChatWidget";

const Chat = () => {
  const [user, setUser] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
      <div className="max-w-4xl mx-auto">
        {user && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}!</h1>
            <p className="text-muted-foreground">Chat with Maya assistant</p>
          </div>
        )}
        
        <ChatWidget onUserChange={setUser} />
      </div>
    </div>
  );
};

export default Chat;
