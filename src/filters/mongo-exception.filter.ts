import { Request, Response } from "express";
import { MongoServerError } from "mongodb";
import { Error as MongooseError } from "mongoose";

import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";

import { ErrorResponse } from "./error-response.type";

@Catch(MongooseError.ValidationError, MongooseError.CastError, MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const isValidationError = exception instanceof MongooseError.ValidationError;
        const isCastError = exception instanceof MongooseError.CastError;
        const isDuplicateError = exception instanceof MongoServerError && exception.code === 11000;

        const errorResponse: ErrorResponse = {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: "something-went-wrong-m"
        };

        if (isValidationError) {
            errorResponse.statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
            errorResponse.message = Object.values(exception.errors)?.[0]?.message ?? "validation-error";
        } else if (isCastError) {
            errorResponse.statusCode = HttpStatus.BAD_REQUEST;
            errorResponse.message = `invalid-value-for-field-${exception.path}`;
        } else if (isDuplicateError) {
            errorResponse.statusCode = HttpStatus.BAD_REQUEST;
            errorResponse.message = "duplicate-values-on-unique-fields";
        }

        response.status(errorResponse.statusCode).json(errorResponse);
    }
}
