type EventCallback = (data: any) => void;

export class EventManager {
    private static instance: EventManager;
    private listeners: Map<string, EventCallback[]> = new Map();

    private constructor() { }

    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    subscribe(event: string, callback: EventCallback): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    notify(event: string, data: any): void {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.forEach(callback => callback(data));
        }
    }
}
