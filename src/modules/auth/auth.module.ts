import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PassportModule } from "@nestjs/passport";

import { AdminGuard } from "./guards/admin.guard";
import { JwtAuthGuard } from "./guards/jwt.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
    imports: [PassportModule],
    providers: [
        AdminGuard,
        JwtStrategy,
        JwtAuthGuard,
        {
            provide: APP_GUARD,
            useExisting: JwtAuthGuard
        }
    ]
})
export class AuthModule {}
