import { EmailSQSPayload } from "src/common/types/email-sqs-payload.type";

import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { captureException as captureExceptionSentry } from "@sentry/nestjs";

@Injectable()
export class SqsService {
    private readonly logger = new Logger("sideproject-be-sqs-service");
    private readonly client: SQSClient;
    private readonly queueUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.client = new SQSClient({
            region: this.configService.getOrThrow<string>("AWS_REGION"),
            credentials: {
                accessKeyId: this.configService.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
                secretAccessKey: this.configService.getOrThrow<string>("AWS_SECRET_ACCESS_KEY")
            }
        });
        this.queueUrl = this.configService.getOrThrow<string>("AWS_SQS_EMAIL_QUEUE_URL");
    }

    async publishMessage(payload: EmailSQSPayload) {
        try {
            await this.client.send(
                new SendMessageCommand({
                    QueueUrl: this.queueUrl,
                    MessageBody: JSON.stringify(payload)
                })
            );
        } catch (error) {
            this.logger.error(error);
            captureExceptionSentry(error, { extra: payload });
            return;
        }
    }
}
