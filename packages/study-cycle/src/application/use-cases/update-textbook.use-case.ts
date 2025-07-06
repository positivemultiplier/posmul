import { IUseCase, Result, UseCaseError } from "@posmul/shared-types";
import { Textbook } from "../../domain/entities/textbook.entity";
import { ITextbookRepository } from "../../domain/repositories/textbook.repository";
import {
  TextbookResponseDto,
  UpdateTextbookRequestDto,
} from "../dto/textbook.dto";

export class UpdateTextbookUseCase
  implements IUseCase<UpdateTextbookRequestDto, TextbookResponseDto>
{
  constructor(private readonly textbookRepository: ITextbookRepository) {}

  async execute(
    request: UpdateTextbookRequestDto
  ): Promise<Result<TextbookResponseDto, UseCaseError>> {
    const textbookResult = await this.textbookRepository.findById(request.id);
    if (!textbookResult.success) {
      return {
        success: false,
        error: new UseCaseError(
          "Failed to find textbook",
          textbookResult.error
        ),
      };
    }
    if (!textbookResult.data) {
      return { success: false, error: new UseCaseError("Textbook not found") };
    }

    const textbook = textbookResult.data;

    // This is a simplified update. A more robust implementation would handle individual property updates.
    const updatedTextbook = Textbook.fromPersistence({
      ...textbook.propsAsJson,
      title: request.title ?? textbook.propsAsJson.title,
      updatedAt: new Date(),
    });

    const saveResult = await this.textbookRepository.save(updatedTextbook);
    if (!saveResult.success) {
      return {
        success: false,
        error: new UseCaseError("Failed to save textbook", saveResult.error),
      };
    }

    const responseDto: TextbookResponseDto = {
      ...updatedTextbook.propsAsJson,
      createdAt: updatedTextbook.propsAsJson.createdAt.toISOString(),
      updatedAt: updatedTextbook.propsAsJson.updatedAt.toISOString(),
    };

    return { success: true, data: responseDto };
  }
}
