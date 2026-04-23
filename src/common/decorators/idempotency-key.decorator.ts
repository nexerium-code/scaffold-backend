import { isUUID } from "class-validator";
import { Request } from "express";

import { BadRequestException, createParamDecorator, ExecutionContext } from "@nestjs/common";

export const IdempotencyKey = createParamDecorator((data: unknown, context: ExecutionContext) => {
    // Get request from context
    const request = context.switchToHttp().getRequest<Request>();
    // Get idempotency key from headers
    const idempotencyKey = request.headers["idempotency-key"] as string;
    // Check if idempotency key is specified
    if (!idempotencyKey) throw new BadRequestException("idempotency-key-not-specified");
    // Check if idempotency key is a valid UUID
    if (!isUUID(idempotencyKey)) throw new BadRequestException("invalid-idempotency-key-format");
    // Return idempotency key
    return idempotencyKey;
});
