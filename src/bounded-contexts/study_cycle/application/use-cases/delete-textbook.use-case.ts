import { ITextbookRepository } from "../../domain/repositories/textbook.repository";
import { TextbookId } from "../../domain/entities/textbook.entity";
import { Result } from "@/shared/types";
import { UseCaseError } from "@/shared/errors";
import { IUseCase } from "@/shared/types";

export class DeleteTextbookUseCase implements IUseCase<TextbookId, void> {
    constructor(private readonly textbookRepository: ITextbookRepository) {}

    async execute(
        id: TextbookId
    ): Promise<Result<void, UseCaseError>> {
        const deleteResult = await this.textbookRepository.delete(id);

        if (!deleteResult.success) {
            return { success: false, error: new UseCaseError("Failed to delete textbook", deleteResult.error) };
        }

        return { success: true, data: undefined };
    }
} 