import { PartialType } from "@nestjs/mapped-types";

import { CreateExampleNestedSubItemDto } from "./create-example-nested-sub-item.dto";

export class UpdateExampleNestedSubItemDto extends PartialType(CreateExampleNestedSubItemDto) {}
