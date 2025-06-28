import { ITextbookRepository } from "../../domain/repositories/textbook.repository";
import { Textbook } from "../../domain/entities/textbook.entity";
import { CreateTextbookRequestDto, TextbookResponseDto } from "../dto/textbook.dto";
import { Result } from "@/shared/types";
import { UseCaseError, ValidationError } from "@/shared/errors";
import { IUseCase } from "@/shared/types";

export class CreateTextbookUseCase implements IUseCase<CreateTextbookRequestDto, TextbookResponseDto> {
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
            return { success: false, error: new UseCaseError("Failed to save textbook", saveResult.error) };
        }
        
        const responseDto: TextbookResponseDto = {
            ...textbook.propsAsJson,
            createdAt: textbook.propsAsJson.createdAt.toISOString(),
            updatedAt: textbook.propsAsJson.updatedAt.toISOString(),
        };

        return { success: true, data: responseDto };
    }
} 