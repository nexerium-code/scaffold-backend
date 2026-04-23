export enum Role {
    ADMIN = "admin",
    STAFF = "staff"
}

export type Permissions = Record<string, Permission>;

export type Permission = {
    attendance: boolean;
    participants: boolean;
    workshops: boolean;
    feedbacks: boolean;
};

export type MetaData = {
    role: Role;
    permissions: Permissions | undefined;
};
