type EventCallback = (data: any) => void;

/**
 * Simple event emitter for React Native
 */
class EventEmitter {
  private events: { [key: string]: EventCallback[] } = {};

  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Callback function
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Unsubscribe from an event
   * @param event Event name
   * @param callback Callback function
   */
  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  /**
   * Emit an event with data
   * @param event Event name
   * @param data Data to pass to callbacks
   */
  emit(event: string, data: any): void {
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Remove all listeners for an event
   * @param event Event name
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// Create a singleton instance for contacts events
export const contactsEventEmitter = new EventEmitter();

export default EventEmitter;
