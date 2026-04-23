import { Permissions, Role } from "./permissions.type";

export type User = {
    sessionId: string;
    userId: string;
    role: Role;
    permissions: Permissions | undefined;
};
