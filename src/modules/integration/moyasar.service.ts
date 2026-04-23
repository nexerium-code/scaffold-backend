import axios, { AxiosResponse } from "axios";
import { CardInfoDto } from "src/common/dto/card-info.dto";

import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type MoyasarResponse = {
    status: string;
    id: string;
    source: { transaction_url: string };
};

@Injectable()
export class MoyasarService {
    constructor(private readonly configService: ConfigService) {}

    async createPayment(cardInfo: CardInfoDto, ammount: number, description: string) {
        try {
            const response: AxiosResponse<MoyasarResponse> = await axios.post(
                this.configService.getOrThrow<string>("MOYASAR_API_ENDPOINT"),
                {
                    amount: ammount * 100,
                    currency: "SAR",
                    description,
                    callback_url: `${this.configService.getOrThrow<string>("FRONTEND_ORIGIN_REGISTRATION")}/payment`,
                    source: {
                        type: "creditcard",
                        ...cardInfo
                    }
                },
                {
                    auth: {
                        username: this.configService.getOrThrow<string>("MOYASAR_PUBLISHABLE_API_KEY"),
                        password: ""
                    },
                    withCredentials: false
                }
            );
            if (response?.data?.status && response.data?.status !== "initiated") throw new BadRequestException("payment-processing-failed");
            return {
                paymentId: response?.data?.id ?? "",
                transactionURL: response?.data?.source?.transaction_url ?? ""
            };
        } catch (error) {
            throw new BadRequestException("payment-processing-failed", { cause: error });
        }
    }

    async validatePayment(paymentId: string) {
        try {
            const response: AxiosResponse<MoyasarResponse> = await axios.get(`${this.configService.getOrThrow("MOYASAR_API_ENDPOINT")}/${paymentId}`, {
                auth: {
                    username: this.configService.getOrThrow("MOYASAR_SECRET_API_SECRET"),
                    password: ""
                },
                withCredentials: false
            });
            if (response.data.status === "paid") return true;
            return false;
        } catch (error) {
            throw new BadRequestException("payment-validation-failed", { cause: error });
        }
    }
}
