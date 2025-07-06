export class UseCaseError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'UseCaseError';
    }
}
