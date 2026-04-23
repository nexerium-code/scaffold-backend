import { Module } from "@nestjs/common";

import { EmailService } from "./email.service";
import { MoyasarService } from "./moyasar.service";
import { PlacidService } from "./placid.service";
import { S3Service } from "./s3.service";
import { SqsService } from "./sqs.service";

@Module({
    providers: [EmailService, MoyasarService, PlacidService, S3Service, SqsService],
    exports: [EmailService, MoyasarService, PlacidService, S3Service, SqsService]
})
export class IntegrationModule {}
