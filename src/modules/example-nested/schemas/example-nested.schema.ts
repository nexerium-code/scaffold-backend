import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type ExampleNestedDocument = HydratedDocument<ExampleNested>;

@Schema({ timestamps: true })
export class ExampleNested {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: "ExampleRoot", required: true })
    rootId: MongooseSchema.Types.ObjectId;

    @Prop({ type: String, required: true, trim: true })
    name: string;

    @Prop({ type: Boolean, default: true })
    published: boolean;
}

export const ExampleNestedSchema = SchemaFactory.createForClass(ExampleNested);
