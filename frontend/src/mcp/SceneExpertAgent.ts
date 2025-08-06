import { Agent } from './Agent';
import { Message } from './MessageBus';
import { MCPClient, createMCPClient } from './pubsub';
import { extractJson } from '../utils/json';
import sceneExpertPrompt from '../prompts/scene_expert_prompt.txt?raw';
import sceneGuidance from '../prompts/scene_guidance.txt?raw';

export class SceneExpertAgent extends Agent {
  role = 'scene_expert';
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
          const action = request.action.startsWith('scene/') ? request.action : `scene/${request.action}`;
          await this.mcpClient.sendRequest(action, request.params);
        }
        this.sendMessage('manager', { status: 'complete', task: message.content.task });
      } catch (error) {
        console.error("Failed to parse JSON from scene expert:", jsonResponse, error);
        this.sendMessage('manager', { status: 'error', error: 'Scene expert failed to produce valid JSON.' });
      }
    }
  }

  private getExpertPrompt(goal: string): string {
    let prompt = sceneExpertPrompt.replace('{{goal}}', goal);
    prompt = prompt.replace('{{guidance}}', sceneGuidance);
    return prompt;
  }
}
