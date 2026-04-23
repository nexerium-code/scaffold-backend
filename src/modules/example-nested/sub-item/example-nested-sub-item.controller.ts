import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { CreateExampleNestedSubItemDto } from "./dto/create-example-nested-sub-item.dto";
import { UpdateExampleNestedSubItemDto } from "./dto/update-example-nested-sub-item.dto";
import { ExampleNestedSubItemService } from "./example-nested-sub-item.service";

@Controller("sub-item")
export class ExampleNestedSubItemController {
    constructor(private readonly exampleNestedSubItemService: ExampleNestedSubItemService) {}

    @Get()
    findForParent(@Query("nestedId") nestedId: string) {
        if (nestedId) return this.exampleNestedSubItemService.findByNestedId(nestedId);
        return this.exampleNestedSubItemService.findAll();
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.exampleNestedSubItemService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateExampleNestedSubItemDto) {
        return this.exampleNestedSubItemService.create(dto);
    }

    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: UpdateExampleNestedSubItemDto) {
        return this.exampleNestedSubItemService.update(id, dto);
    }

    @Delete(":id")
    remove(@Param("id") id: string) {
        return this.exampleNestedSubItemService.remove(id);
    }
}
