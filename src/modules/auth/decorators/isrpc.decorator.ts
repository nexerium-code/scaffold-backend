import { SetMetadata } from "@nestjs/common";

export const IS_RPC_KEY = "isRpc";
export const IsRPC = () => SetMetadata(IS_RPC_KEY, true);
