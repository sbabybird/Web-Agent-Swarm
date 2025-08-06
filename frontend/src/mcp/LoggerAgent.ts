import { Agent } from './Agent';
import { Message } from './MessageBus';

export class LoggerAgent extends Agent {
  role = 'logger';
  private addLog: (message: string) => void;

  constructor(addLog: (message: string) => void) {
    super();
    this.addLog = addLog;
  }

  handleMessage(message: Message): void {
    // The logger agent logs all messages, so it doesn't need to handle specific messages.
    this.addLog(`[${message.sender} -> ${message.receiver}]: ${JSON.stringify(message.content)}`);
  }
}
