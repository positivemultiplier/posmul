import { Result } from "./common";

export interface IUseCase<TRequest, TResponse> {
    execute(request: TRequest): Promise<Result<TResponse, Error>>;
} 