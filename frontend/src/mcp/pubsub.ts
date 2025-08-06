// A simple, in-memory pub/sub system to replace the MCP SDK dependency.

type Handler = (params: any) => Promise<any>;

const handlers = new Map<string, Handler>();

export function createMCPServer() {
  return {
    handle: (method: string, handler: Handler) => {
      handlers.set(method, handler);
      console.log(`[PubSub] Registered handler for ${method}`);
    },
  };
}

export function createMCPClient() {
  return {
    sendRequest: async (method: string, params: any) => {
      const handler = handlers.get(method);
      if (handler) {
        console.log(`[PubSub] Invoking handler for ${method}`);
        return await handler(params);
      } else {
        console.error(`[PubSub] No handler found for method: ${method}`);
        throw new Error(`No handler found for method: ${method}`);
      }
    },
  };
}

// Define the types for convenience, so we don't have to change the agent/server files.
export type MCPServer = ReturnType<typeof createMCPServer>;
export type MCPClient = ReturnType<typeof createMCPClient>;
