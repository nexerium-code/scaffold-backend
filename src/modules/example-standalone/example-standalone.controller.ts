import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { CreateExampleRootDto } from "./dto/create-example-root.dto";
import { UpdateExampleRootDto } from "./dto/update-example-root.dto";
import { ExampleStandaloneService } from "./example-standalone.service";

@Controller("standalone")
export class ExampleStandaloneController {
    constructor(private readonly exampleStandaloneService: ExampleStandaloneService) {}

    @Get()
    list() {
        return this.exampleStandaloneService.list();
    }

    @Get(":id")
    getById(@Param("id") id: string) {
        return this.exampleStandaloneService.getById(id);
    }

    @Post()
    create(@Body() dto: CreateExampleRootDto) {
        return this.exampleStandaloneService.create(dto);
    }

    @Patch(":id")
    updateById(@Param("id") id: string, @Body() dto: UpdateExampleRootDto) {
        return this.exampleStandaloneService.updateById(id, dto);
    }

    @Delete(":id")
    removeById(@Param("id") id: string) {
        return this.exampleStandaloneService.removeById(id);
    }
}
