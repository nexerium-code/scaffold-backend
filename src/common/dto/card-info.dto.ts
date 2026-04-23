import { IsNotEmpty, Matches, Max, Min } from "class-validator";

export class CardInfoDto {
    @IsNotEmpty({ message: "invalid-card-holder-name" })
    @Matches(/^[\w.-]+(?: [\w.-]+)*$/, { message: "invalid-card-holder-name" })
    name: string;

    @IsNotEmpty({ message: "invalid-card-number" })
    @Matches(/^\d{16,19}$/, { message: "invalid-card-number" })
    number: string;

    @IsNotEmpty({ message: "invalid-card-expiration-month" })
    @Min(1, { message: "invalid-card-expiration-month" })
    @Max(12, { message: "invalid-card-expiration-month" })
    month: number;

    @IsNotEmpty({ message: "invalid-card-expiration-year" })
    @Min(new Date().getFullYear(), { message: "invalid-card-expiration-year" })
    year: number;

    @IsNotEmpty()
    @Matches(/^\d{3,4}$/, { message: "invalid-cvc" })
    cvc: string;
}
