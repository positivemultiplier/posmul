import { Result } from "@/shared/types/common";
import { RepositoryError } from "@/shared/errors";
import { Textbook, TextbookId } from "../entities/textbook.entity";

export interface ITextbookRepository {
    save(textbook: Textbook): Promise<Result<void, RepositoryError>>;
    findById(id: TextbookId): Promise<Result<Textbook | null, RepositoryError>>;
    delete(id: TextbookId): Promise<Result<void, RepositoryError>>;
    findAllByCreator(creatorId: string): Promise<Result<Textbook[], RepositoryError>>;
} 