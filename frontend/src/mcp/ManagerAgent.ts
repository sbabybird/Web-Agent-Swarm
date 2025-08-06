import { Agent } from './Agent';
import { Message } from './MessageBus';

export class ManagerAgent extends Agent {
  role = 'manager';
  private runLLM: (prompt: string) => Promise<any>;

  constructor(runLLM: (prompt: string) => Promise<any>) {
    super();
    this.runLLM = runLLM;
  }

  async handleMessage(message: Message): Promise<void> {
    if (message.content.goal) {
      const managerPrompt = this.getManagerPrompt(message.content.goal);
      const expertName = await this.runLLM(managerPrompt);
      
      // Directly send the original goal to the chosen expert.
      this.sendMessage(expertName.trim(), { task: message.content.goal });

    } else if (message.content.status === 'complete') {
      // Forward the completion message to the UI
      this.sendMessage('ui', { status: 'complete' });
    }
  }

  private getManagerPrompt(goal: string): string {
    return `User goal: "${goal}". Which expert is best for this task? Your answer MUST be a single word from this list: [canvas_expert]`;
  }
}
