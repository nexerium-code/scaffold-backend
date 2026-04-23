export class NoErrorThrownError extends Error {}

export async function getError<T>(call: () => unknown): Promise<T> {
    try {
        await call();
        throw new NoErrorThrownError();
    } catch (error: unknown) {
        return error as T;
    }
}
