import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { CreateExampleNestedSubItemDto } from "./dto/create-example-nested-sub-item.dto";
import { UpdateExampleNestedSubItemDto } from "./dto/update-example-nested-sub-item.dto";
import { ExampleNestedSubItemService } from "./example-nested-sub-item.service";

@Controller("sub-item")
export class ExampleNestedSubItemController {
    constructor(private readonly exampleNestedSubItemService: ExampleNestedSubItemService) {}

    @Get(":nestedId")
    getAll(@Param("nestedId") nestedId: string) {
        return this.exampleNestedSubItemService.getAll(nestedId);
    }

    @Get(":nestedId/:subItemId")
    getById(@Param("nestedId") nestedId: string, @Param("subItemId") subItemId: string) {
        return this.exampleNestedSubItemService.getById(nestedId, subItemId);
    }

    @Post(":nestedId")
    create(@Param("nestedId") nestedId: string, @Body() dto: CreateExampleNestedSubItemDto) {
        return this.exampleNestedSubItemService.create(nestedId, dto);
    }

    @Patch(":nestedId/:subItemId")
    update(@Param("nestedId") nestedId: string, @Param("subItemId") subItemId: string, @Body() dto: UpdateExampleNestedSubItemDto) {
        return this.exampleNestedSubItemService.update(nestedId, subItemId, dto);
    }

    @Delete(":nestedId/:subItemId")
    delete(@Param("nestedId") nestedId: string, @Param("subItemId") subItemId: string) {
        return this.exampleNestedSubItemService.delete(nestedId, subItemId);
    }
}
