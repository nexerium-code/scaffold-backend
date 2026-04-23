import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ExampleStandaloneController } from "./example-standalone.controller";
import { ExampleStandaloneService } from "./example-standalone.service";
import { ExampleRoot, ExampleRootSchema } from "./schemas/example-root.schema";

@Module({
    controllers: [ExampleStandaloneController],
    providers: [ExampleStandaloneService],
    imports: [MongooseModule.forFeature([{ name: ExampleRoot.name, schema: ExampleRootSchema }])]
})
export class ExampleStandaloneModule {}
