import { IsIn, IsMimeType, IsNotEmpty, IsString } from "class-validator";

export class GetPictureUploadUrlDto {
    @IsString()
    @IsNotEmpty()
    @IsMimeType()
    @IsIn(["image/png", "image/jpeg", "image/jpg", "image/webp"], { message: "invalid-type" })
    mime: string;
}
