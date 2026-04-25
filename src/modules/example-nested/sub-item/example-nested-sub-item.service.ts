import { Model } from "mongoose";

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { ExampleNestedService } from "../example-nested.service";
import { CreateExampleNestedSubItemDto } from "./dto/create-example-nested-sub-item.dto";
import { UpdateExampleNestedSubItemDto } from "./dto/update-example-nested-sub-item.dto";
import { ExampleNestedSubItem, ExampleNestedSubItemDocument } from "./schemas/example-nested-sub-item.schema";

@Injectable()
export class ExampleNestedSubItemService {
    constructor(
        @InjectModel(ExampleNestedSubItem.name) private readonly exampleNestedSubItemModel: Model<ExampleNestedSubItemDocument>,
        private readonly exampleNestedService: ExampleNestedService
    ) {}

    // Child handlers stay scoped to an existing parent record.
    async getAll(nestedId: string) {
        await this.exampleNestedService.getById(nestedId);
        return this.exampleNestedSubItemModel.find({ nestedId }).exec();
    }

    async getById(nestedId: string, subItemId: string) {
        await this.exampleNestedService.getById(nestedId);
        const doc = await this.exampleNestedSubItemModel.findOne({ _id: subItemId, nestedId }).exec();
        if (!doc) throw new NotFoundException("example-nested-sub-item-not-found");
        return doc;
    }

    async create(nestedId: string, dto: CreateExampleNestedSubItemDto) {
        await this.exampleNestedService.getById(nestedId);
        return this.exampleNestedSubItemModel.create({ ...dto, nestedId });
    }

    async update(nestedId: string, subItemId: string, dto: UpdateExampleNestedSubItemDto) {
        await this.exampleNestedService.getById(nestedId);
        const doc = await this.exampleNestedSubItemModel.findOneAndUpdate({ _id: subItemId, nestedId }, dto, { new: true }).exec();
        if (!doc) throw new NotFoundException("example-nested-sub-item-not-found");
        return doc;
    }

    async delete(nestedId: string, subItemId: string) {
        await this.exampleNestedService.getById(nestedId);
        const res = await this.exampleNestedSubItemModel.findOneAndDelete({ _id: subItemId, nestedId }).exec();
        if (!res) throw new NotFoundException("example-nested-sub-item-not-found");
    }
}
