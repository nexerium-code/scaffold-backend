import { User } from "./user.type";

export type RequestWithParams = {
    user: User;
    params?: { eventId: string };
};
