import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { ExampleNestedSubItemStatus } from "../../../../common/constants/example-nested.constants";

export class CreateExampleNestedSubItemDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsEnum(ExampleNestedSubItemStatus)
    @IsOptional()
    status?: ExampleNestedSubItemStatus;
}
