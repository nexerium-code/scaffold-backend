import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { ExampleNestedSubItemStatus } from "../../../../common/constants/example-nested.constants";

export class CreateExampleNestedSubItemDto {
    @IsMongoId()
    nestedId: string;

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
