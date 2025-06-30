import { Result } from "./errors";

export interface IUseCase<TRequest, TResponse> {
  execute(request?: TRequest): Promise<Result<TResponse, Error>>;
}
