import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CredentialsCopyButtonProps {
  content: string;
}

interface Credentials {
  login: string;
  password: string;
}

const CredentialsCopyButton = ({ content }: CredentialsCopyButtonProps) => {
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const { toast } = useToast();

  // Função para extrair credenciais do texto
  const extractCredentials = (text: string): Credentials | null => {
    // Padrão para detectar se é uma resposta de usuário temporário
    const tempUserPattern = /Usuário temporário criado com sucesso/i;
    if (!tempUserPattern.test(text)) {
      return null;
    }

    // Extrair login (CNPJ no formato XX.XXX.XXX/XXXX-XX)
    const loginMatch = text.match(/Login:\s*\n\s*([0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2})/);
    
    // Extrair senha (após "Senha:" até a próxima linha que contém "Link")
    const passwordMatch = text.match(/Senha:\s*\n\s*([^\n]+)/);

    if (loginMatch && passwordMatch) {
      return {
        login: loginMatch[1].trim(),
        password: passwordMatch[1].trim()
      };
    }

    return null;
  };

  const credentials = extractCredentials(content);

  if (!credentials) {
    return null;
  }

  // Função para detectar se está rodando em iframe
  const isInIframe = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  };

  // Função fallback para copiar usando document.execCommand
  const fallbackCopyToClipboard = (text: string): boolean => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      return false;
    }
  };

  const copyToClipboard = async (text: string, type: 'login' | 'password') => {
    let success = false;
    
    try {
      // Tenta usar a API moderna do clipboard primeiro
      if (navigator.clipboard && navigator.clipboard.writeText && !isInIframe()) {
        await navigator.clipboard.writeText(text);
        success = true;
      } else {
        // Fallback para document.execCommand (funciona em iframes)
        success = fallbackCopyToClipboard(text);
      }
      
      if (success) {
        if (type === 'login') {
          setCopiedLogin(true);
          setTimeout(() => setCopiedLogin(false), 2000);
        } else {
          setCopiedPassword(true);
          setTimeout(() => setCopiedPassword(false), 2000);
        }

        toast({
          title: "Copiado!",
          description: `${type === 'login' ? 'Login' : 'Senha'} copiado para a área de transferência`,
        });
      } else {
        throw new Error('Falha ao copiar');
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
        Credenciais de Acesso
      </div>
      
      <div className="space-y-2">
        {/* Login */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border">
          <div className="flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">Login:</div>
            <div className="font-mono text-sm">{credentials.login}</div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(credentials.login, 'login')}
            className="ml-2 h-8 w-8 p-0"
          >
            {copiedLogin ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Senha */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border">
          <div className="flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">Senha:</div>
            <div className="font-mono text-sm">{credentials.password}</div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(credentials.password, 'password')}
            className="ml-2 h-8 w-8 p-0"
          >
            {copiedPassword ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CredentialsCopyButton;