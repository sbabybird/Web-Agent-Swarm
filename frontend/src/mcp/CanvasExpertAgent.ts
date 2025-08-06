import { Agent } from './Agent';
import { Message } from './MessageBus';
import { MCPClient, createMCPClient } from './pubsub';
import { extractJson } from '../utils/json';
import canvasExpertPrompt from '../prompts/canvas_expert_prompt.txt?raw';
import canvasGuidance from '../prompts/canvas_guidance.txt?raw';

export class CanvasExpertAgent extends Agent {
  role = 'canvas_expert';
  private mcpClient: MCPClient;
  private runLLM: (prompt: string) => Promise<any>;

  constructor(runLLM: (prompt: string) => Promise<any>) {
    super();
    this.mcpClient = createMCPClient();
    this.runLLM = runLLM;
  }

  async handleMessage(message: Message): Promise<void> {
    if (message.content.task) {
      const expertPrompt = this.getExpertPrompt(message.content.task);
      const jsonResponse = await this.runLLM(expertPrompt);
      const cleanJson = extractJson(jsonResponse);
      
      try {
        const requests = JSON.parse(cleanJson);
        for (const request of requests) {
          await this.mcpClient.sendRequest(request.action, request.params);
        }
        this.sendMessage('manager', { status: 'complete', task: message.content.task });
      } catch (error) {
        console.error("Failed to parse JSON from canvas expert:", jsonResponse, error);
        this.sendMessage('manager', { status: 'error', error: 'Canvas expert failed to produce valid JSON.' });
      }
    }
  }

  private getExpertPrompt(goal: string): string {
    let prompt = canvasExpertPrompt.replace('{{goal}}', goal);
    // For now, we inject the full guidance every time.
    // A more advanced implementation could dynamically select relevant guidance.
    prompt = prompt.replace('{{guidance}}', canvasGuidance);
    return prompt;
  }
}
