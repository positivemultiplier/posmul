export class UseCaseError extends Error {
    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = 'UseCaseError';
    }
} 