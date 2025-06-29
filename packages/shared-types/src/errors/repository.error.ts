/**
 * Repository Error
 * 
 * Represents errors that occur in repository operations.
 */

export class RepositoryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "RepositoryError";
  }
}
