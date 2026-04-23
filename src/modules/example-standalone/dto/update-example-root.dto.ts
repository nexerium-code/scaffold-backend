import { PartialType } from "@nestjs/mapped-types";

import { CreateExampleRootDto } from "./create-example-root.dto";

export class UpdateExampleRootDto extends PartialType(CreateExampleRootDto) {}
