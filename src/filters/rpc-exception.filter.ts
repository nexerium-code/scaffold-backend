import { Observable, throwError } from "rxjs";

import { ArgumentsHost, Catch, HttpStatus, Logger, RpcExceptionFilter as BaseRpcExceptionFilter } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

import { ErrorResponse } from "./error-response.type";

@Catch(RpcException)
export class RpcExceptionFilter implements BaseRpcExceptionFilter<RpcException> {
    private readonly logger = new Logger("sideproject-be-rpc-exception");

    catch(exception: RpcException, host: ArgumentsHost): Observable<ErrorResponse> {
        const ctx = host.switchToRpc();

        const statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        const timestamp = new Date().toISOString();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const path = (ctx?.getContext?.()?.args?.[2] as string) ?? "rpc_action";
        const message = exception?.message ?? "something-went-wrong-r";

        const errorResponse: ErrorResponse = {
            statusCode,
            timestamp,
            path,
            message
        };

        // Log and send the response
        this.logger.error(errorResponse);
        return throwError(() => errorResponse);
    }
}
