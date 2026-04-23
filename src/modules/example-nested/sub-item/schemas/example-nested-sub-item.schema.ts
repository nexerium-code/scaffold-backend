import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { ExampleNestedSubItemStatus } from "../../../../common/constants/example-nested.constants";

export type ExampleNestedSubItemDocument = HydratedDocument<ExampleNestedSubItem>;

@Schema({ timestamps: true })
export class ExampleNestedSubItem {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: "ExampleNested", required: true })
    nestedId: MongooseSchema.Types.ObjectId;

    @Prop({ type: String, required: true, trim: true })
    title: string;

    @Prop({ type: String, default: "" })
    note: string;

    @Prop({ type: String, enum: Object.values(ExampleNestedSubItemStatus), default: ExampleNestedSubItemStatus.DRAFT })
    status: ExampleNestedSubItemStatus;
}

export const ExampleNestedSubItemSchema = SchemaFactory.createForClass(ExampleNestedSubItem);
