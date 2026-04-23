import { Model } from "mongoose";

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { CreateExampleNestedSubItemDto } from "./dto/create-example-nested-sub-item.dto";
import { UpdateExampleNestedSubItemDto } from "./dto/update-example-nested-sub-item.dto";
import { ExampleNestedSubItem, ExampleNestedSubItemDocument } from "./schemas/example-nested-sub-item.schema";

@Injectable()
export class ExampleNestedSubItemService {
    constructor(
        @InjectModel(ExampleNestedSubItem.name) private readonly exampleNestedSubItemModel: Model<ExampleNestedSubItemDocument>
    ) {}

    async findAll() {
        return this.exampleNestedSubItemModel.find().exec();
    }

    async findByNestedId(nestedId: string) {
        return this.exampleNestedSubItemModel.find({ nestedId }).exec();
    }

    async findOne(id: string) {
        const doc = await this.exampleNestedSubItemModel.findById(id).exec();
        if (!doc) throw new NotFoundException("example-nested-sub-item-not-found");
        return doc;
    }

    async create(dto: CreateExampleNestedSubItemDto) {
        return this.exampleNestedSubItemModel.create(dto);
    }

    async update(id: string, dto: UpdateExampleNestedSubItemDto) {
        const doc = await this.exampleNestedSubItemModel.findByIdAndUpdate(id, dto, { new: true }).exec();
        if (!doc) throw new NotFoundException("example-nested-sub-item-not-found");
        return doc;
    }

    async remove(id: string) {
        const res = await this.exampleNestedSubItemModel.findByIdAndDelete(id).exec();
        if (!res) throw new NotFoundException("example-nested-sub-item-not-found");
    }
}
