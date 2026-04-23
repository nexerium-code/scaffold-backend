import { ArrayNotEmpty, IsArray, IsMongoId } from "class-validator";

export class MultiTargetDto {
    @IsArray({ message: "please-provide-an-array-of-enrollee-ids" })
    @ArrayNotEmpty({ message: "please-provide-at-least-one-enrollee-id" })
    @IsMongoId({ each: true, message: "please-provide-valid-enrollee-ids" })
    targets: string[];
}
