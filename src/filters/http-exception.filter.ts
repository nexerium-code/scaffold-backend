import { Request, Response } from "express";

import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";

import { ErrorResponse } from "./error-response.type";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const statusCode = exception.getStatus();
        const timestamp = new Date().toISOString();
        const path = request.url;
        const message = exception?.message ?? "something-went-wrong-h";

        const errorResponse: ErrorResponse = {
            statusCode,
            timestamp,
            path,
            message
        };

        response.status(statusCode).json(errorResponse);
    }
}
