import { Agent } from './Agent';

export type Message = {
  sender: string;
  receiver: string;
  content: any;
};

class MessageBus {
  private agents: Map<string, Agent> = new Map();

  register(agent: Agent) {
    this.agents.set(agent.role, agent);
    agent.setMessageBus(this);
  }

  dispatch(message: Message) {
    const receiver = this.agents.get(message.receiver);
    if (receiver) {
      receiver.handleMessage(message);
    } else {
      console.warn(`No agent found for role: ${message.receiver}`);
    }
  }
}

export default new MessageBus();
