import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import sendgrid from "@sendgrid/mail";

type BulkSendOptions = {
    feedbackId: string;
    templateId: string;
    recipients: string[];
    from: string;
};

@Injectable()
export class EmailService {
    private readonly logger = new Logger("service-feedback-email-service");
    private readonly CHUNK_SIZE = 50;

    constructor(private readonly configService: ConfigService) {
        sendgrid.setApiKey(this.configService.getOrThrow<string>("SENDGRID_API_KEY"));
    }

    async bulkSendEmails(options: BulkSendOptions): Promise<number> {
        const { feedbackId, from, templateId, recipients } = options;

        let emailsSent = 0;

        for (let i = 0; i < recipients.length; i += this.CHUNK_SIZE) {
            const chunk = recipients.slice(i, i + this.CHUNK_SIZE);

            try {
                await sendgrid.send({
                    templateId,
                    from,
                    personalizations: chunk.map((email) => ({ to: email }))
                });
                emailsSent += chunk.length;
            } catch (error) {
                this.logger.error(error);
                throw new InternalServerErrorException(`Feedback bulk send failed for feedbackId: ${feedbackId}`, { cause: error });
            }
        }

        return emailsSent;
    }
}
