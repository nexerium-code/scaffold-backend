import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { CreateExampleNestedSubItemDto } from "./dto/create-example-nested-sub-item.dto";
import { UpdateExampleNestedSubItemDto } from "./dto/update-example-nested-sub-item.dto";
import { ExampleNestedSubItemService } from "./example-nested-sub-item.service";

@Controller("nested/:nestedId/sub-items")
export class ExampleNestedSubItemController {
    constructor(private readonly exampleNestedSubItemService: ExampleNestedSubItemService) {}

    @Get()
    listByNestedId(@Param("nestedId") nestedId: string) {
        return this.exampleNestedSubItemService.listByNestedId(nestedId);
    }

    @Get(":id")
    getById(@Param("nestedId") nestedId: string, @Param("id") id: string) {
        return this.exampleNestedSubItemService.getById(nestedId, id);
    }

    @Post()
    create(@Param("nestedId") nestedId: string, @Body() dto: CreateExampleNestedSubItemDto) {
        return this.exampleNestedSubItemService.create(nestedId, dto);
    }

    @Patch(":id")
    updateById(@Param("nestedId") nestedId: string, @Param("id") id: string, @Body() dto: UpdateExampleNestedSubItemDto) {
        return this.exampleNestedSubItemService.updateById(nestedId, id, dto);
    }

    @Delete(":id")
    removeById(@Param("nestedId") nestedId: string, @Param("id") id: string) {
        return this.exampleNestedSubItemService.removeById(nestedId, id);
    }
}
