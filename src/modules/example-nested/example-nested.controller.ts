import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { CreateExampleNestedDto } from "./dto/create-example-nested.dto";
import { UpdateExampleNestedDto } from "./dto/update-example-nested.dto";
import { ExampleNestedService } from "./example-nested.service";

@Controller("nested")
export class ExampleNestedController {
    constructor(private readonly exampleNestedService: ExampleNestedService) {}

    @Get()
    findAll() {
        return this.exampleNestedService.findAll();
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.exampleNestedService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateExampleNestedDto) {
        return this.exampleNestedService.create(dto);
    }

    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: UpdateExampleNestedDto) {
        return this.exampleNestedService.update(id, dto);
    }

    @Delete(":id")
    remove(@Param("id") id: string) {
        return this.exampleNestedService.remove(id);
    }
}
