import { PartialType } from "@nestjs/mapped-types";

import { CreateExampleNestedDto } from "./create-example-nested.dto";

export class UpdateExampleNestedDto extends PartialType(CreateExampleNestedDto) {}
