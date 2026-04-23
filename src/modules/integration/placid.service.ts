import axios from "axios";

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { captureException as captureExceptionSentry } from "@sentry/nestjs";

type BadgeData = {
    templateId: string;
    data: Map<string, unknown>;
    qrCodeToken: string;
    picture?: string;
};

@Injectable()
export class PlacidService {
    private readonly logger = new Logger("sideproject-be-placid-service");

    constructor(private readonly configService: ConfigService) {}

    async createBadge(badgeData: BadgeData) {
        try {
            await axios.post(
                this.configService.getOrThrow<string>("PLACID_API_ENDPOINT"),
                {
                    pages: [
                        {
                            template_uuid: badgeData.templateId,
                            layers: this.transformDataToLayers(badgeData)
                        }
                    ],
                    transfer: {
                        to: "s3",
                        key: this.configService.getOrThrow<string>("PLACID_AWS_ACCESS_KEY_ID"),
                        secret: this.configService.getOrThrow<string>("PLACID_AWS_SECRET_ACESS_KEY"),
                        region: this.configService.getOrThrow<string>("AWS_REGION"),
                        bucket: this.configService.getOrThrow<string>("AWS_S3_BUCKET"),
                        path: `badges/${badgeData.qrCodeToken}.pdf`,
                        visibility: "private"
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.configService.getOrThrow<string>("PLACID_API_KEY")}`
                    }
                }
            );
        } catch (error) {
            this.logger.error(error);
            captureExceptionSentry(error, { extra: badgeData });
            return;
        }
    }

    transformDataToLayers(badgeData: BadgeData) {
        const dataObject = Object.fromEntries(badgeData.data);

        const layers: Record<string, object> = {
            qrCodeToken: { value: badgeData.qrCodeToken }
        };

        for (const [key, value] of Object.entries(dataObject)) {
            layers[key] = {
                text: value
            };
        }

        if (badgeData.picture) {
            layers.picture = {
                image: badgeData.picture
            };
        }

        return layers;
    }
}
