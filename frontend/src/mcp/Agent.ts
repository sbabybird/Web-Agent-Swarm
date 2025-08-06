import MessageBus, { Message } from './MessageBus';

export abstract class Agent {
  abstract role: string;
  protected messageBus: MessageBus | null = null;

  setMessageBus(bus: MessageBus) {
    this.messageBus = bus;
  }

  protected sendMessage(receiver: string, content: any) {
    if (this.messageBus) {
      this.messageBus.dispatch({ sender: this.role, receiver, content });
    } else {
      console.error('MessageBus not set for agent:', this.role);
    }
  }

  abstract handleMessage(message: Message): void;
}
