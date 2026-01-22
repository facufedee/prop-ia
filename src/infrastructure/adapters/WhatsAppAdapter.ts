import { MessagingAdapter } from "@/domain/adapters/MessagingAdapter";
import { whatsappService } from "../services/whatsappService";

export class WhatsAppAdapter implements MessagingAdapter {
    async sendMessage(to: string, message: string): Promise<void> {
        // Adapting the existing synchronous service to the async interface
        // In a real backend scenario, this would potentially call an API
        whatsappService.sendMessage(to, message);
        return Promise.resolve();
    }
}
