import { User } from "src/modules/auth/types/user.type";
import { Role } from "src/modules/auth/types/permissions.type";

import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest<{ user: User }>();
        return user?.role === Role.ADMIN;
    }
}
