import { HydratedDocument } from "mongoose";
import { ExampleRootCategory } from "src/common/constants/example-standalone.constants";

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type ExampleRootDocument = HydratedDocument<ExampleRoot>;

@Schema({ timestamps: true })
export class ExampleRoot {
    @Prop({ type: String, required: true, trim: true })
    title: string;

    @Prop({ type: String, default: "" })
    content: string;

    @Prop({ type: String, enum: ExampleRootCategory, default: ExampleRootCategory.A })
    category: ExampleRootCategory;

    @Prop({ type: Boolean, default: true })
    published: boolean;
}

export const ExampleRootSchema = SchemaFactory.createForClass(ExampleRoot);
