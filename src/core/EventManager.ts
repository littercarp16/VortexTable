import type { TableEventMap } from '../types';

export class EventManager {
  private eventTarget: EventTarget;

  constructor() {
    this.eventTarget = new EventTarget();
  }

  public on<K extends keyof TableEventMap>(
    eventName: K,
    callback: (event: TableEventMap[K]) => void
  ): void {
    this.eventTarget.addEventListener(eventName, callback as EventListener);
  }

  public off<K extends keyof TableEventMap>(
    eventName: K,
    callback: (event: TableEventMap[K]) => void
  ): void {
    this.eventTarget.removeEventListener(eventName, callback as EventListener);
  }

  public dispatchEvent<K extends keyof TableEventMap>(
    eventName: K,
    detail: TableEventMap[K] extends CustomEvent<infer D> ? D : never
  ): void {
    const event = new CustomEvent(eventName, { detail });
    this.eventTarget.dispatchEvent(event);
  }

  public destroy(): void {
    // In a real-world scenario, you might want to remove all listeners.
  }
} 