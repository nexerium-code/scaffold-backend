import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ExampleNestedController } from "./example-nested.controller";
import { ExampleNestedService } from "./example-nested.service";
import { ExampleNested, ExampleNestedSchema } from "./schemas/example-nested.schema";
import { ExampleNestedSubItemController } from "./sub-item/example-nested-sub-item.controller";
import { ExampleNestedSubItemService } from "./sub-item/example-nested-sub-item.service";
import { ExampleNestedSubItem, ExampleNestedSubItemSchema } from "./sub-item/schemas/example-nested-sub-item.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ExampleNested.name, schema: ExampleNestedSchema },
            { name: ExampleNestedSubItem.name, schema: ExampleNestedSubItemSchema }
        ])
    ],
    controllers: [ExampleNestedController, ExampleNestedSubItemController],
    providers: [ExampleNestedService, ExampleNestedSubItemService]
})
export class ExampleNestedModule {}
