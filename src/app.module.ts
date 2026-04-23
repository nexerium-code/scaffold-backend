import { AllExceptionsFilter } from "src/filters/all-exceptions.filter";
import { HttpExceptionFilter } from "src/filters/http-exception.filter";
import { MongoExceptionFilter } from "src/filters/mongo-exception.filter";
import { RpcExceptionFilter } from "src/filters/rpc-exception.filter";
import { AuthModule } from "src/modules/auth/auth.module";
import { ExampleNestedModule } from "src/modules/example-nested/example-nested.module";
import { ExampleStandaloneModule } from "src/modules/example-standalone/example-standalone.module";
import { IntegrationModule } from "src/modules/integration/integration.module";

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { SentryModule } from "@sentry/nestjs/setup";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
    imports: [
        SentryModule.forRoot(),
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                let uri = configService.getOrThrow<string>("DATABASE_URL");
                const username = configService.getOrThrow<string>("DATABASE_USERNAME");
                const password = configService.getOrThrow<string>("DATABASE_PASSWORD");
                uri = uri.replace("<USERNAME>", username).replace("<PASSWORD>", password);
                return { uri, ignoreUndefined: true };
            }
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 100,
                skipIf: (context) => context.getType() === "rpc"
            }
        ]),
        AuthModule,
        IntegrationModule,
        // Scaffold: ExampleRoot CRUD → GET/PATCH/POST/DELETE /example/standalone/...
        ExampleStandaloneModule,
        // Scaffold: ExampleNested CRUD + parent-owned ExampleNestedSubItem CRUD → /nested/..., /nested/:nestedId/sub-items/...
        ExampleNestedModule
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter
        },
        {
            provide: APP_FILTER,
            useClass: MongoExceptionFilter
        },
        {
            provide: APP_FILTER,
            useClass: RpcExceptionFilter
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard
        }
    ]
})
export class AppModule {}
