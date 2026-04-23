import { Model } from "mongoose";

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { CreateExampleNestedSubItemDto } from "./dto/create-example-nested-sub-item.dto";
import { UpdateExampleNestedSubItemDto } from "./dto/update-example-nested-sub-item.dto";
import { ExampleNested, ExampleNestedDocument } from "../schemas/example-nested.schema";
import { ExampleNestedSubItem, ExampleNestedSubItemDocument } from "./schemas/example-nested-sub-item.schema";

@Injectable()
export class ExampleNestedSubItemService {
    constructor(
        @InjectModel(ExampleNested.name) private readonly exampleNestedModel: Model<ExampleNestedDocument>,
        @InjectModel(ExampleNestedSubItem.name) private readonly exampleNestedSubItemModel: Model<ExampleNestedSubItemDocument>
    ) {}

    // Child handlers stay scoped to an existing parent record.
    async listByNestedId(nestedId: string) {
        await this.findParentOrThrow(nestedId);
        return this.exampleNestedSubItemModel.find({ nestedId }).exec();
    }

    async getById(nestedId: string, id: string) {
        await this.findParentOrThrow(nestedId);
        const doc = await this.exampleNestedSubItemModel.findOne({ _id: id, nestedId }).exec();
        if (!doc) throw new NotFoundException("example-nested-sub-item-not-found");
        return doc;
    }

    async create(nestedId: string, dto: CreateExampleNestedSubItemDto) {
        await this.findParentOrThrow(nestedId);
        return this.exampleNestedSubItemModel.create({ ...dto, nestedId });
    }

    async updateById(nestedId: string, id: string, dto: UpdateExampleNestedSubItemDto) {
        await this.findParentOrThrow(nestedId);
        const doc = await this.exampleNestedSubItemModel.findOneAndUpdate({ _id: id, nestedId }, dto, { new: true }).exec();
        if (!doc) throw new NotFoundException("example-nested-sub-item-not-found");
        return doc;
    }

    async removeById(nestedId: string, id: string) {
        await this.findParentOrThrow(nestedId);
        const res = await this.exampleNestedSubItemModel.findOneAndDelete({ _id: id, nestedId }).exec();
        if (!res) throw new NotFoundException("example-nested-sub-item-not-found");
    }

    private async findParentOrThrow(nestedId: string) {
        const parent = await this.exampleNestedModel.findById(nestedId).select("_id").exec();
        if (!parent) throw new NotFoundException("example-nested-not-found");
        return parent;
    }
}
