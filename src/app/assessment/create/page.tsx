"use server";

import { revalidatePath } from "next/cache";
import { CreateAssessmentUseCase } from "@/bounded-contexts/assessment/application/use-cases/create-assessment.use-case";
import { McpSupabaseAssessmentRepository } from "@/bounded-contexts/assessment/infrastructure/repositories/assessment.repository";
import { createUserId, SupabaseProjectId } from "@/shared/types/branded-types";

async function createAssessmentAction(formData: FormData) {
  const title = formData.get("title") as string;
  
  // 실제 환경에서는 인증된 사용자 ID를 가져와야 합니다.
  const creatorId = createUserId("user_2c3a4b5d6e7f8g9h"); 
  const projectId = process.env.SUPABASE_PROJECT_ID as SupabaseProjectId;

  if (!title || !creatorId || !projectId) {
    console.error("Missing required fields");
    return;
  }
  
  const repo = new McpSupabaseAssessmentRepository(projectId);
  const useCase = new CreateAssessmentUseCase(repo);
  
  const result = await useCase.execute({ title, creatorId });

  if (result.success) {
    console.log("Assessment created:", result.data.assessmentId);
    revalidatePath("/assessment");
  } else {
    console.error("Failed to create assessment:", result.error);
  }
}

export default function CreateAssessmentPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Assessment</h1>
      <form action={createAssessmentAction} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Assessment Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Assessment
        </button>
      </form>
    </div>
  );
} 