interface N8NConfig {
  webhookUrl: string;
  timeout?: number;
}

interface SendMessageParams {
  message: string;
  userId: string;
  userName: string;
  userStatus: string;
}

export class N8NClient {
  private config: N8NConfig;

  constructor(config: N8NConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  async sendMessage(params: SendMessageParams): Promise<any> {
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: params.message,
          user: {
            id: params.userId,
            name: params.userName,
            status: params.userStatus,
          },
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`);
      }

      return await response.json();
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
