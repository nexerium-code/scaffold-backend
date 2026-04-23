import { Model } from "mongoose";

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { CreateExampleNestedDto } from "./dto/create-example-nested.dto";
import { UpdateExampleNestedDto } from "./dto/update-example-nested.dto";
import { ExampleNested, ExampleNestedDocument } from "./schemas/example-nested.schema";

@Injectable()
export class ExampleNestedService {
    constructor(@InjectModel(ExampleNested.name) private readonly exampleNestedModel: Model<ExampleNestedDocument>) {}

    async findAll() {
        return this.exampleNestedModel.find().exec();
    }

    async findOne(id: string) {
        const doc = await this.exampleNestedModel.findById(id).exec();
        if (!doc) throw new NotFoundException("example-nested-not-found");
        return doc;
    }

    async create(dto: CreateExampleNestedDto) {
        return this.exampleNestedModel.create(dto);
    }

    async update(id: string, dto: UpdateExampleNestedDto) {
        const doc = await this.exampleNestedModel.findByIdAndUpdate(id, dto, { new: true }).exec();
        if (!doc) throw new NotFoundException("example-nested-not-found");
        return doc;
    }

    async remove(id: string) {
        const res = await this.exampleNestedModel.findByIdAndDelete(id).exec();
        if (!res) throw new NotFoundException("example-nested-not-found");
    }
}
