import { Chapter, TextbookId } from "../../domain/entities/textbook.entity";

export interface CreateTextbookRequestDto {
    title: string;
    creatorId: string; // This should be derived from the authenticated user server-side
}

export interface UpdateTextbookRequestDto {
    id: TextbookId;
    title?: string;
}

export interface AddChapterRequestDto {
    textbookId: TextbookId;
    chapterTitle: string;
}

export interface TextbookResponseDto {
    id: TextbookId;
    title: string;
    creatorId: string;
    chapters: Chapter[];
    createdAt: string;
    updatedAt: string;
} 