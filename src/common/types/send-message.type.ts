import { streamText, UIMessage, UIMessageStreamOnFinishCallback } from "ai";

export type SendMessageResult = {
    result: ReturnType<typeof streamText>;
    originalMessages: UIMessage[];
    onFinish: UIMessageStreamOnFinishCallback<UIMessage>;
    generateMessageId: () => string;
};
