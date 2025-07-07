/**
 * Repository Error
 *
 * Represents errors that occur in repository operations.
 */
export declare class RepositoryError extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
//# sourceMappingURL=repository.error.d.ts.map