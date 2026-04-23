import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { CreateExampleRootDto } from "./dto/create-example-root.dto";
import { UpdateExampleRootDto } from "./dto/update-example-root.dto";
import { ExampleStandaloneService } from "./example-standalone.service";

@Controller("standalone")
export class ExampleStandaloneController {
    constructor(private readonly exampleStandaloneService: ExampleStandaloneService) {}

    @Get()
    findAll() {
        return this.exampleStandaloneService.findAll();
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.exampleStandaloneService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateExampleRootDto) {
        return this.exampleStandaloneService.create(dto);
    }

    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: UpdateExampleRootDto) {
        return this.exampleStandaloneService.update(id, dto);
    }

    @Delete(":id")
    remove(@Param("id") id: string) {
        return this.exampleStandaloneService.remove(id);
    }
}
