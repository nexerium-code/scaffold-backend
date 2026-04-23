import { Model } from "mongoose";

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { CreateExampleRootDto } from "./dto/create-example-root.dto";
import { UpdateExampleRootDto } from "./dto/update-example-root.dto";
import { ExampleRoot, ExampleRootDocument } from "./schemas/example-root.schema";

@Injectable()
export class ExampleStandaloneService {
    constructor(@InjectModel(ExampleRoot.name) private readonly exampleRootModel: Model<ExampleRootDocument>) {}

    async findAll() {
        return this.exampleRootModel.find().exec();
    }

    async findOne(id: string) {
        const doc = await this.exampleRootModel.findById(id).exec();
        if (!doc) throw new NotFoundException("example-root-not-found");
        return doc;
    }

    async create(dto: CreateExampleRootDto) {
        return this.exampleRootModel.create(dto);
    }

    async update(id: string, dto: UpdateExampleRootDto) {
        const doc = await this.exampleRootModel.findByIdAndUpdate(id, dto, { new: true }).exec();
        if (!doc) throw new NotFoundException("example-root-not-found");
        return doc;
    }

    async remove(id: string) {
        const res = await this.exampleRootModel.findByIdAndDelete(id).exec();
        if (!res) throw new NotFoundException("example-root-not-found");
    }
}
