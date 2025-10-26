interface N8NConfig {
  webhookUrl: string;
  timeout?: number;
}

interface SendMessageParams {
  chatInput: string;
  sessionId: string;
  userEmail?: string | null;
  userStatus?: string | null;
}

interface N8NResponse {
  output?: string;
  response?: string;
  user_temp_login?: string;
  message?: string;
  sessionId?: string;
  code?: number;
}

export class N8NClient {
  private config: N8NConfig;

  constructor(config: N8NConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  async sendMessage(chatInput: string, sessionId: string, userEmail?: string, userStatus?: string): Promise<N8NResponse> {
    try {
      const payload = { 
        chatInput, 
        sessionId,
        userEmail: userEmail || null,
        userStatus: userStatus || null
      };
      
      console.log('Enviando mensagem para:', this.config.webhookUrl);
      console.log('Payload:', payload);
      console.log('Current sessionId:', sessionId);
      console.log('User email:', userEmail);
      console.log('User status:', userStatus);

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      // Verificar se response.headers existe antes de acessar
      if (response && response.headers && typeof response.headers.entries === 'function') {
        try {
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        } catch (headerError) {
          console.warn('Erro ao acessar headers da resposta:', headerError);
        }
      } else {
        console.warn('Response headers não disponível ou não é uma função');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);
      console.log('Response text length:', responseText.length);
      console.log('Response text type:', typeof responseText);

      let data: N8NResponse;

      try {
        data = JSON.parse(responseText);
        console.log('Parsed data:', data);
        console.log('Data type:', typeof data);
        console.log('Data keys:', Object.keys(data || {}));
      } catch (jsonError) {
        console.error('Invalid JSON response:', responseText);
        console.error('JSON parse error:', jsonError);
        console.error('Raw response that failed to parse:', responseText.substring(0, 500));
        throw new Error('Resposta inválida do servidor - não é um JSON válido');
      }

      // Verificar se há erro específico do webhook N8N
      if (data.code === 0 && data.message && data.message.includes('Workflow could not be started')) {
        console.error('N8N Workflow Error:', data.message);
        throw new Error('O workflow do N8N não pôde ser iniciado. Verifique se o webhook está ativo e configurado corretamente.');
      }

      return data;
    } catch (error) {
      console.error("N8N webhook error:", error);
      throw error;
    }
  }
}

// Example usage:
// const n8n = new N8NClient({ webhookUrl: "YOUR_N8N_WEBHOOK_URL" });
// const response = await n8n.sendMessage({
//   message: "Hello",
//   userId: "123",
//   userName: "John",
//   userStatus: "available"
// });
