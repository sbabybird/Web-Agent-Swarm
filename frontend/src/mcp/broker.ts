type Listener = (payload: any) => void;

class MCPBroker {
  private eventListeners: Map<string, Listener[]> = new Map();

  public onEvent(eventName: string, callback: Listener) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(callback);
  }

  public emitEvent(eventName: string, data: any) {
    const listeners = this.eventListeners.get(eventName) || [];
    listeners.forEach(listener => listener(data));
  }
}

export default new MCPBroker(); // Export a singleton instance
