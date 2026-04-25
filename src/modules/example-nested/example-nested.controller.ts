import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { CreateExampleNestedDto } from "./dto/create-example-nested.dto";
import { UpdateExampleNestedDto } from "./dto/update-example-nested.dto";
import { ExampleNestedService } from "./example-nested.service";

@Controller("nested")
export class ExampleNestedController {
    constructor(private readonly exampleNestedService: ExampleNestedService) {}

    @Get()
    getAll() {
        return this.exampleNestedService.getAll();
    }

    @Get(":id")
    getById(@Param("id") id: string) {
        return this.exampleNestedService.getById(id);
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
    delete(@Param("id") id: string) {
        return this.exampleNestedService.delete(id);
    }
}
