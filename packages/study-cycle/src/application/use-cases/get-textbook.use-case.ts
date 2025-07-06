import { IUseCase, Result, UseCaseError } from "@posmul/shared-types";
import { TextbookId } from "../../domain/entities/textbook.entity";
import { ITextbookRepository } from "../../domain/repositories/textbook.repository";
import { TextbookResponseDto } from "../dto/textbook.dto";

export class GetTextbookUseCase
  implements IUseCase<TextbookId, TextbookResponseDto | null>
{
  constructor(private readonly textbookRepository: ITextbookRepository) {}

  async execute(
    id: TextbookId
  ): Promise<Result<TextbookResponseDto | null, UseCaseError>> {
    const textbookResult = await this.textbookRepository.findById(id);

    if (!textbookResult.success) {
      return {
        success: false,
        error: new UseCaseError("Failed to get textbook", textbookResult.error),
      };
    }

    const textbook = textbookResult.data;

    if (!textbook) {
      return { success: true, data: null };
    }

    const responseDto: TextbookResponseDto = {
      ...textbook.propsAsJson,
      createdAt: textbook.propsAsJson.createdAt.toISOString(),
      updatedAt: textbook.propsAsJson.updatedAt.toISOString(),
    };

    return { success: true, data: responseDto };
  }
}
