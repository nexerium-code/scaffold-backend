import { IS_RPC_KEY } from "src/modules/auth/decorators/isrpc.decorator";
import { IS_PUBLIC_KEY } from "src/modules/auth/decorators/public.decorator";

import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RpcException } from "@nestjs/microservices";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
        if (isPublic) return true;

        // For microservices, require explicit opt-in via @IsRPC() to bypass HTTP JWT auth.
        if (context.getType() === "rpc") {
            const isRpc = this.reflector.getAllAndOverride<boolean>(IS_RPC_KEY, [context.getHandler(), context.getClass()]);
            if (isRpc) return true;
            throw new RpcException("rpc-handler-not-allowed");
        }

        return super.canActivate(context);
    }
}
