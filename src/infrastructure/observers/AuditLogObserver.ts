import { EventManager } from "../events/EventManager";

export class AuditLogObserver {
    constructor() {
        const events = EventManager.getInstance();
        events.subscribe('ACTION_PERFORMED', this.logAction.bind(this));
    }

    logAction(data: any): void {
        console.log(`[AUDIT LOG] Action: ${data.action} | User: ${data.userId} | Timestamp: ${new Date().toISOString()}`);
        // Here calls to auditLogService could be made
    }
}
