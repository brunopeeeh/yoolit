import { useState, useEffect } from "react";
import { LogIn, LogInIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ProjectVersion from "./ProjectVersion";
import { N8NClient } from "@/lib/n8n";
import { useUser } from "@/hooks/useUser";
import packageJson from "../../../package.json";

interface ChatWidgetProps {
  user?: any;
  profile?: any;
}

const ChatWidget = ({ user: propUser, profile }: ChatWidgetProps) => {
  const { user, isLoggedIn } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  // Inicializar sessionId
  useEffect(() => {
    if (!sessionId) {
      setSessionId(crypto.randomUUID());
    }
  }, [sessionId]);

  // Log profile changes for debugging
  useEffect(() => {
    if (profile) {
      console.log('Profile updated in ChatWidget:', profile);
      console.log('Current profile status:', profile.status);
    }
  }, [profile]);

  // Inicializar cliente N8N
  const n8nClient = new N8NClient({
    webhookUrl: import.meta.env.VITE_N8N_TEST_WEBHOOK_URL || "https://yooga-tecnologia.app.n8n.cloud/webhook/3abc3fd3-73d6-486f-ae58-7e8fbe7e6854"
  });

  const handleSendMessage = async (content: string) => {
    // Verificar se o usuário está logado antes de enviar mensagem
    if (!isLoggedIn) {
      console.warn('Usuário não autenticado tentou enviar mensagem');
      return;
    }

    if (!content.trim() || !sessionId) return;

    const userMessage = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      console.log('Sending message with profile status:', profile?.status);
      const response = await n8nClient.sendMessage(content, sessionId, user?.email, profile?.status);

      // Atualizar sessionId se retornado pela API
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }

      // Limpar tags HTML da resposta
      const cleanContent = (response.output || response.response || response.user_temp_login || response.message || 'Desculpe, não consegui processar sua mensagem.')
        .replace(/<b>/g, '')
        .replace(/<\/b>/g, '');

      const botMessage = {
        id: (Date.now() + 1).toString(),
        content: cleanContent,
        sender: "bot",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      let errorContent = 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.';
      
      // Tratamento específico para erro de webhook N8N
      if (error instanceof Error) {
        if (error.message.includes('workflow do N8N não pôde ser iniciado')) {
          errorContent = 'O serviço de chat está temporariamente indisponível. Por favor, tente novamente em alguns minutos.';
        } else if (error.message.includes('Usuário não autenticado')) {
          errorContent = 'Você precisa estar logado para enviar mensagens.';
        } else if (error.message.includes('Resposta inválida do servidor')) {
          errorContent = 'Erro de comunicação com o servidor. Tente novamente.';
        }
      }
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        sender: "bot",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    // Gerar novo sessionId ao limpar o chat
    setSessionId(crypto.randomUUID());
  };

  const handleCommand = (command: string, args?: string[]) => {
    switch (command.toLowerCase()) {
      case 'version':
        const versionMessage = {
          id: crypto.randomUUID(),
          content: `Versão do projeto: ${packageJson.version}`,
          sender: 'system',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, versionMessage]);
        break;
        
      case 'clear':
        handleClearChat();
        break;
        
      case 'help':
        const helpMessage = {
          id: crypto.randomUUID(),
          content: `Comandos disponíveis:
/version - Exibe a versão do projeto
/clear - Limpa o histórico de mensagens
/help - Exibe esta ajuda
/status - Exibe informações do sistema`,
          sender: 'system',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, helpMessage]);
        break;
        
      case 'status':
        const statusMessage = {
          id: crypto.randomUUID(),
          content: `Status do sistema:
- Usuário logado: ${isLoggedIn ? 'Sim' : 'Não'}
- Session ID: ${sessionId}
- Total de mensagens: ${messages.length}
- Versão: ${packageJson.version}`,
          sender: 'system',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, statusMessage]);
         break;
         
       default:
         const unknownMessage = {
           id: crypto.randomUUID(),
           content: `Comando desconhecido: /${command}. Digite /help para ver os comandos disponíveis.`,
           sender: 'system',
           timestamp: new Date().toISOString(),
         };
         setMessages(prev => [...prev, unknownMessage]);
         break;
     }
   };

  return (
    <div className="flex h-full flex-col max-w-5xl mx-auto">
      <ChatMessages messages={messages} isTyping={isTyping} />

      {!isLoggedIn && (
        <div className="px-3 sm:px-6 pb-2">
          <div className="max-w-4xl mx-auto">
            <Alert className="bg-amber-50/80 border-amber-200/60 dark:bg-amber-950/30 dark:border-amber-800/40 rounded-xl py-2.5">
              <LogInIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
                Faça login para enviar mensagens
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      <ChatInput 
        onSendMessage={handleSendMessage} 
        onClear={handleClearChat}
        onCommand={handleCommand}
        disabled={!isLoggedIn}
      />
      
      <ProjectVersion />
    </div>
  );
};

export default ChatWidget;