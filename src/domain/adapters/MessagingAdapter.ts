export interface MessagingAdapter {
    sendMessage(to: string, message: string): Promise<void>;
}
