import { Schema as MongooseSchema } from "mongoose";

type UUIDLike = {
    toString: () => string;
};

function isUUIDLike(value: unknown): value is UUIDLike {
    return value !== null && typeof value === "object" && "toString" in value && typeof value.toString === "function";
}

export function toUUIDstring(value: unknown): string {
    if (typeof value === "string") return value;
    if (isUUIDLike(value)) return value.toString();
    return "";
}

export function toOptionalUUIDstring(value: unknown): string | undefined {
    if (value == null) return undefined;
    return toUUIDstring(value);
}

MongooseSchema.Types.UUID.get((value: unknown) => (value == null ? value : toUUIDstring(value)));
