import "./instruments";

import cookieParser from "cookie-parser";
import helmet from "helmet";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";

async function bootstrap() {
    // HTTP Server Configuration
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);
    app.enableCors({
        origin: [/^http:\/\/localhost(?::\d+)?$/, configService.getOrThrow<string>("FRONTEND_ORIGIN_MAIN"), configService.getOrThrow<string>("FRONTEND_ORIGIN_REGISTRATION")],
        credentials: true
    });
    app.use(helmet());
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    app.set("query parser", "extended");
    // Start HTTP Server
    await app.listen(configService.getOrThrow<number>("PORT"), configService.getOrThrow<string>("HOST"));
}
void bootstrap();
