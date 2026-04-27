# Integrations and side effects

All third-party SDK access, vendor HTTP calls, and raw vendor payload mapping live in a dedicated integration layer. Domain services depend on integration services; they never touch vendor clients directly. This file defines the integration contract, idempotency rules, and side-effect ordering.

## 1 — Integration layer placement

- Location: `src/modules/integration/`.
- One **service per vendor**: `sqs.service.ts`, `s3.service.ts`, `resend.service.ts`, `clerk.service.ts`, `openai.service.ts`, etc.
- One `integration.module.ts` that declares all integration services as providers and exports the ones other features consume.
- Each integration service is `@Injectable()` and is injected into domain services through normal NestJS DI.

```ts
@Module({
    providers: [SqsService, S3Service, EmailService],
    exports: [SqsService, S3Service, EmailService]
})
export class IntegrationModule {}
```

- Feature modules that need integrations import `IntegrationModule`.

## 2 — Integration service contract

- Expose **business-meaningful methods**: `publishMessage`, `sendEmail`, `generateUploadUrl`, `downloadAsset`, `createBadge`, not vendor-shaped primitives — unless the repository explicitly standardizes the raw-call pattern.
- Hide vendor-specific field names, request shapes, and SDK quirks inside the service. Domain code must not see `Messages[0].Body.MessageAttributes` or equivalent vendor noise.
- Input types are **your domain types**, not SDK types. Output types are your domain types.
- Internally, the service reads required configuration via `ConfigService.getOrThrow(...)`. No `process.env` reads inside integration services either.
- Keep retry and idempotency logic **explicit and documented**. Do not bury retry assumptions in undocumented helper code.

### 2.1 Example shape (reference)

```ts
@Injectable()
export class SqsService {
    private readonly logger = new Logger("integration-sqs");
    private readonly client: SQSClient;
    private readonly queueUrl: string;

    constructor(private readonly config: ConfigService) {
        this.queueUrl = this.config.getOrThrow<string>("SQS_QUEUE_URL");
        this.client = new SQSClient({ region: this.config.getOrThrow<string>("AWS_REGION") });
    }

    async publishMessage(payload: EmailPayload): Promise<void> {
        try {
            await this.client.send(
                new SendMessageCommand({
                    QueueUrl: this.queueUrl,
                    MessageBody: JSON.stringify(payload)
                })
            );
        } catch (err) {
            this.logger.error("sqs-publish-failed", { error: err, payload });
            captureException(err);
            // Fire-and-forget by contract: do not rethrow unless the caller awaits.
        }
    }
}
```

## 3 — How domain services consume integrations

- Domain services inject the integration service: `constructor(private readonly sqsService: SqsService) {}`.
- Domain services call the business-meaningful method: `this.sqsService.publishMessage({ ... })`.
- Domain services never import vendor SDK packages.
- If the domain needs a feature the integration service doesn't expose, **add a method to the integration service**. Do not reach around it.

## 4 — Side-effect ordering

Writes must happen in this order inside a service method:

1. **Resolve dependencies** — load the parent aggregate, load the resource under mutation.
2. **Validate** — existence, authorization, business state.
3. **Persist core business state** — the durable write (transactional if multi-document).
4. **Trigger non-critical side effects** — emails, SQS publishes, notifications, webhooks.
5. **Return** — kebab-case success string or data.

Do **not** trigger external side effects before the primary write succeeds unless the product explicitly requires that ordering (e.g., pre-issuing a signed URL before the metadata row).

## 5 — Fire-and-forget side effects

- Use `void` on calls whose failure must not break the primary user flow:

    ```ts
    void this.sqsService.publishMessage({ ... });
    void this.emailService.sendEmail({ ... });
    ```

- The integration service is responsible for its own error handling: `try/catch`, `this.logger.error(...)`, `captureException(err)`.
- The domain service does not await and does not catch.
- If the side effect is business-critical (payment capture, subscription state change), it is **not** fire-and-forget — await it, handle failure, surface errors.

## 6 — Idempotency and retry safety

### 6.1 When to apply idempotency

- Retry-prone create flows.
- Externally triggered submissions (webhooks, public forms).
- Any write that clients may resend due to network instability.

### 6.2 How to apply it

- Controllers extract the key via `@IdempotencyKey() idempotencyKey: string`.
- The decorator validates key format at the boundary (throws `BadRequestException("idempotency-key-invalid")` on malformed input).
- Services accept `idempotencyKey: string` as a parameter on the affected method.
- The service pre-checks for an existing record keyed by `idempotencyKey` and returns the stable success string if the record already exists:

    ```ts
    const existing = await this.workshopModel.findOne({ idempotencyKey }).select("+idempotencyKey");
    if (existing) return "workshop-created-successfully";
    ```

- The schema **must** have a unique index on `idempotencyKey` as the race-safe backstop:

    ```ts
    @Prop({ type: String, required: true, select: false })
    idempotencyKey: string;

    WorkshopSchema.index({ idempotencyKey: 1 }, { unique: true });
    ```

- The `idempotencyKey` field uses `select: false` so it is not returned in default reads.

### 6.3 When _not_ to apply idempotency

- Read operations.
- Simple updates where duplicate submission is not a real risk.
- Internal admin actions where the user directly controls submission.

Do not force idempotency onto every mutation. Use it where duplicate submission is a real risk.

## 7 — Webhooks and external triggers

- Webhook endpoints are `@Public()` (they cannot carry user JWTs).
- Webhook routes verify the vendor signature using the integration service for that vendor (`clerkService.verifyWebhook(...)`, `stripeService.verifySignature(...)`).
- Webhooks are idempotent by design — vendors retry. Apply idempotency keys (usually the vendor's event id) and a unique index.
- Webhook controllers remain thin: bind the body, call the service, return the success string.
- Webhook side effects follow the same ordering: persist → fire non-critical effects → return.

## 8 — Configuration for integrations

- All integration configuration flows through `ConfigService`.
- Required keys use `ConfigService.getOrThrow<string>("KEY_NAME")` — fail fast at construction time.
- Env var names follow the project convention (SCREAMING_SNAKE_CASE, vendor-prefixed): `AWS_REGION`, `SQS_QUEUE_URL`, `RESEND_API_KEY`, `CLERK_SECRET_KEY`, `S3_BUCKET_NAME`.
- See `rules/configuration-and-dates.md`.

## 9 — Forbidden patterns

- ❌ Vendor SDK imports (`@aws-sdk/...`, `resend`, `axios`, `openai`) inside controllers or domain services.
- ❌ `process.env` reads inside integration services (go through `ConfigService`).
- ❌ Vendor field names (`MessageAttributes`, `x-clerk-signature`, `Metadata.key`) leaking into controllers, DTOs, or domain services.
- ❌ Side effects fired before the primary persistence write succeeds.
- ❌ Swallowed integration errors without log + Sentry capture.
- ❌ Two integration services for the same vendor in parallel (one integration file per vendor).
- ❌ Hardcoded retry assumptions inside ad hoc helper functions. Retry behavior is part of the integration service's documented contract.
