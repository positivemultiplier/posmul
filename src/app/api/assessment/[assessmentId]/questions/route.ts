/**
 * API Route for Question Generation
 *
 * Handles POST requests to create a new question for a specific assessment.
 * Follows Clean Architecture by orchestrating Application and Infrastructure layers.
 */
import { NextRequest, NextResponse } from "next/server";
import { SupabaseProjectService } from "@/shared/mcp/supabase-project.service";
import { McpAssessmentRepository } from "@/bounded-contexts/assessment/infrastructure/repositories/mcp-assessment.repository";
import { CreateQuestionUseCase } from "@/bounded-contexts/assessment/application/use-cases/create-question.use-case";
import { AssessmentId } from "@/bounded-contexts/assessment/domain/entities/assessment.entity";
import { SupabaseMCPClient } from "@/shared/mcp/supabase-client";

// This is a simplified mock. In a real scenario, this would be properly instantiated.
const getMcpClient = (projectId: string) => {
    return new SupabaseMCPClient(projectId);
};

export async function POST(
  request: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const projectId = SupabaseProjectService.getInstance().getProjectId();
    const assessmentRepository = new McpAssessmentRepository(projectId);

    const createQuestionUseCase = new CreateQuestionUseCase(assessmentRepository);

    const body = await request.json();
    const assessmentId = params.assessmentId as AssessmentId;

    const result = await createQuestionUseCase.execute(assessmentId, body);

    if (result.success) {
      return NextResponse.json(result.data, { status: 201 });
    }

    const { error } = result;
    switch (error.name) {
      case "NotFoundError":
        return NextResponse.json({ error: error.message }, { status: 404 });
      case "ValidationError":
      case "DomainError":
        return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 400 });
      default:
        console.error("UseCase Error:", error);
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
  } catch (e: unknown) {
    const error = e as Error;
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
} 