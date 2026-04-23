import { Request, Response } from "express";
import { throwError } from "rxjs";

import { Catch, ContextType, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import { SentryExceptionCaptured } from "@sentry/nestjs";

import { ErrorResponse } from "./error-response.type";

import type { ArgumentsHost } from "@nestjs/common";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger("sideproject-be");

    @SentryExceptionCaptured()
    catch(exception: unknown, host: ArgumentsHost) {
        const contextType = host.getType<ContextType>();

        const errorResponse: ErrorResponse = {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            timestamp: new Date().toISOString(),
            path: this.resolvePath(contextType, host),
            message: "something-went-wrong-a"
        };

        // Debugging: log the full exception + context, but DON'T expose it to client
        this.logger.error({
            contextType,
            ...errorResponse,
            exception
        });

        // Only transport-specific part: how to send the response
        if (contextType === "http") {
            const ctx = host.switchToHttp();
            const res = ctx.getResponse<Response>();
            res.status(errorResponse.statusCode).json(errorResponse);
            return;
        }

        if (contextType === "rpc") {
            return throwError(() => errorResponse);
        }

        return throwError(() => errorResponse);
    }

    private resolvePath(contextType: ContextType, host: ArgumentsHost): string {
        if (contextType === "http") {
            const ctx = host.switchToHttp();
            const req = ctx.getRequest<Request>();
            return req?.url ?? "http_unknown_path";
        }

        if (contextType === "rpc") {
            const ctx = host.switchToRpc();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return (ctx?.getContext?.()?.args?.[2] as string) ?? "rpc_action";
        }

        return "unknown_context";
    }
}
