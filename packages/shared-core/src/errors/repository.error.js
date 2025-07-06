/**
 * Repository Error
 *
 * Represents errors that occur in repository operations.
 */
export class RepositoryError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = "RepositoryError";
    }
}
