import { Request } from "express";
import { Strategy } from "passport-jwt";
import { MetaData } from "src/modules/auth/types/permissions.type";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";

function headerExtractor() {
    return function (req: Request): string | null {
        if (req && req.headers && req.headers["authorization"]) {
            const token = req.headers["authorization"].split(" ")[1];
            if (token) return token;
        }
        return null;
    };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: headerExtractor(),
            secretOrKey: configService.getOrThrow<string>("CLERK_ADMINS_JWT_KEY").replace(/\\n/g, "\n"),
            passReqToCallback: true,
            ignoreExpiration: false
        });
    }

    validate(req: Request, payload: { sid: string; sub: string; metadata: MetaData }) {
        return {
            sessionId: payload.sid,
            userId: payload.sub,
            role: payload.metadata.role,
            permissions: payload.metadata.permissions
        };
    }
}

// function cookieExtractor(name: string) {
//     return function (req: Request): string | null {
//         if (req && req.cookies && req.cookies[name]) return req.cookies[name];
//         return null;
//     };
// }
