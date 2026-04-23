export type EmailSQSPayload = {
    templateId: string;
    to: string;
    from: string;
    dynamicTemplateData: object;
};
