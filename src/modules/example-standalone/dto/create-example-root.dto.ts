import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ExampleRootCategory } from "src/common/constants/example-standalone.constants";

export class CreateExampleRootDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsEnum(ExampleRootCategory)
    @IsOptional()
    category?: ExampleRootCategory;

    @IsBoolean()
    @IsOptional()
    published?: boolean;
}
