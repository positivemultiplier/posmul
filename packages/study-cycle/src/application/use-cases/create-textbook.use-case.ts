import {
  IUseCase,
  Result,
  UseCaseError,
  ValidationError,
} from "@posmul/shared-types";
import { Textbook } from "../../domain/entities/textbook.entity";
import { ITextbookRepository } from "../../domain/repositories/textbook.repository";
import {
  CreateTextbookRequestDto,
  TextbookResponseDto,
} from "../dto/textbook.dto";

export class CreateTextbookUseCase
  implements IUseCase<CreateTextbookRequestDto, TextbookResponseDto>
{
  constructor(private readonly textbookRepository: ITextbookRepository) {}

  async execute(
    request: CreateTextbookRequestDto
  ): Promise<Result<TextbookResponseDto, UseCaseError | ValidationError>> {
    const textbookResult = Textbook.create({
      title: request.title,
      creatorId: request.creatorId,
    });

    if (!textbookResult.success) {
      return textbookResult;
    }

    const textbook = textbookResult.data;
    const saveResult = await this.textbookRepository.save(textbook);

    if (!saveResult.success) {
      return {
        success: false,
        error: new UseCaseError("Failed to save textbook", saveResult.error),
      };
    }

    const responseDto: TextbookResponseDto = {
      ...textbook.propsAsJson,
      createdAt: textbook.propsAsJson.createdAt.toISOString(),
      updatedAt: textbook.propsAsJson.updatedAt.toISOString(),
    };

    return { success: true, data: responseDto };
  }
}
