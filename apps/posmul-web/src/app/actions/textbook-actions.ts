'use server';

import { revalidatePath } from 'next/cache';
import { CreateTextbookRequestDto, UpdateTextbookRequestDto, TextbookResponseDto } from '@/bounded-contexts/study_cycle/application/dto/textbook.dto';
import { CreateTextbookUseCase, UpdateTextbookUseCase, DeleteTextbookUseCase, GetTextbookUseCase } from '@/bounded-contexts/study_cycle/application/use-cases';
import { McpSupabaseTextbookRepository } from '@/bounded-contexts/study_cycle/infrastructure/repositories/mcp-supabase-textbook.repository';
import { TextbookId } from '@/bounded-contexts/study_cycle/domain/entities/textbook.entity';

// Instantiate repository and use cases
// In a real app, this would be handled by a dependency injection container
const textbookRepository = new McpSupabaseTextbookRepository();
const createTextbookUseCase = new CreateTextbookUseCase(textbookRepository);
const getTextbookUseCase = new GetTextbookUseCase(textbookRepository);
const updateTextbookUseCase = new UpdateTextbookUseCase(textbookRepository);
const deleteTextbookUseCase = new DeleteTextbookUseCase(textbookRepository);

type FormState = {
    success: boolean;
    error: string;
    data?: TextbookResponseDto | null;
};

export async function createTextbookAction(_prevState: FormState, formData: FormData): Promise<FormState> {
    const rawFormData: CreateTextbookRequestDto = {
        title: formData.get('title') as string,
        creatorId: 'user-123', // FIXME: Get actual user ID from session
    };

    const result = await createTextbookUseCase.execute(rawFormData);
    if (result.success) {
        revalidatePath('/study-cycle/textbooks');
        return { success: true, data: result.data, error: '' };
    } else {
        return { success: false, error: result.error.message };
    }
}

export async function updateTextbookAction(_prevState: FormState, formData: FormData): Promise<FormState> {
    const rawFormData: UpdateTextbookRequestDto = {
        id: formData.get('id') as TextbookId,
        title: formData.get('title') as string,
    };

    const result = await updateTextbookUseCase.execute(rawFormData);
    if (result.success) {
        revalidatePath(`/study-cycle/textbooks/${rawFormData.id}`);
        revalidatePath('/study-cycle/textbooks');
        return { success: true, data: result.data, error: '' };
    } else {
        return { success: false, error: result.error.message };
    }
}


export async function deleteTextbookAction(id: TextbookId) {
    const result = await deleteTextbookUseCase.execute(id);
    if (result.success) {
        revalidatePath('/study-cycle/textbooks');
        return { success: true };
    } else {
        return { success: false, error: result.error.message };
    }
}

export async function getTextbookAction(id: TextbookId) {
    const result = await getTextbookUseCase.execute(id);
    if (result.success) {
        return { success: true, data: result.data };
    } else {
        return { success: false, error: result.error.message };
    }
} 