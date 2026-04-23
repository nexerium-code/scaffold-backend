import { randomUUID } from "crypto";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class S3Service {
    private readonly client: S3Client;

    constructor(private readonly configService: ConfigService) {
        this.client = new S3Client({
            region: this.configService.getOrThrow<string>("AWS_REGION"),
            credentials: {
                accessKeyId: this.configService.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
                secretAccessKey: this.configService.getOrThrow<string>("AWS_SECRET_ACCESS_KEY")
            }
        });
    }

    async generatePictureUploadUrl(eventId: string, mime: string) {
        const uuid = randomUUID();
        const extension = mime.split("/")[1] || "bin";
        const key = `pictures/${eventId}-${uuid}.${extension}`;

        const command = new PutObjectCommand({
            Bucket: this.configService.getOrThrow<string>("AWS_S3_BUCKET"),
            Key: key,
            ContentType: mime
        });

        const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 60 * 5 });
        const imgUrl = `https://${this.configService.getOrThrow<string>("AWS_S3_BUCKET")}.s3.${this.configService.getOrThrow<string>("AWS_REGION")}.amazonaws.com/${key}`;

        return { uploadUrl, imgUrl };
    }

    async deleteObjectByUrl(fullUrl: string) {
        const baseUrl = `https://${this.configService.getOrThrow<string>("AWS_S3_BUCKET")}.s3.${this.configService.getOrThrow<string>("AWS_REGION")}.amazonaws.com/`;
        const key = fullUrl.replace(baseUrl, "");

        const command = new DeleteObjectCommand({
            Bucket: this.configService.getOrThrow<string>("AWS_S3_BUCKET"),
            Key: key
        });

        await this.client.send(command);

        return "object-deleted-successfully";
    }
}
