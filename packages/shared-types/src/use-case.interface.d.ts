import { Result } from "./errors";
export interface IUseCase<TRequest, TResponse> {
    execute(request?: TRequest): Promise<Result<TResponse, Error>>;
}
//# sourceMappingURL=use-case.interface.d.ts.map