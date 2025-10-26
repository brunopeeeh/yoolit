import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="text-center space-y-6 p-8">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
          <MessageSquare className="h-10 w-10" />
        </div>
        <h1 className="text-5xl font-bold mb-4">Maya Chat Widget</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          A modern chat interface with N8N integration, status management, and real-time messaging
        </p>
        <Button size="lg" onClick={() => navigate("/auth")} className="mt-8">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
