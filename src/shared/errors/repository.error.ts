export class RepositoryError extends Error {
  public readonly cause?: Error;

  constructor(message: string, cause?: any) {
    super(message);
    this.name = "RepositoryError";
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}
