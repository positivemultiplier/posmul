import { notFound } from 'next/navigation';
import { GetAssessmentForSolvingUseCase } from '@/bounded-contexts/assessment/application/use-cases/get-assessment-for-solving.use-case';
import { McpSupabaseAssessmentRepository } from '@/bounded-contexts/assessment/infrastructure/repositories/mcp-assessment.repository';
import { AssessmentContainer } from '@/bounded-contexts/assessment/presentation/components/AssessmentContainer';
import { AssessmentProvider } from '@/bounded-contexts/assessment/presentation/components/AssessmentContext';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function getAssessmentForSolving(assessmentId: string) {
  // This is a simplified DI for server components.
  // In a larger app, a more robust DI container might be used.
  const supabase = createSupabaseServerClient();
  const assessmentRepository = new McpSupabaseAssessmentRepository(supabase);
  const getAssessmentUseCase = new GetAssessmentForSolvingUseCase(assessmentRepository);

  const result = await getAssessmentUseCase.execute({ assessmentId });

  if (result.isFailure) {
    // Log the error for debugging
    console.error(result.error);
    return null;
  }

  return result.value;
}

export default async function AssessmentPage({ params }: { params: { assessmentId: string } }) {
  const assessment = await getAssessmentForSolving(params.assessmentId);

  if (!assessment) {
    notFound();
  }

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-4xl">
        <AssessmentProvider assessment={assessment}>
            <AssessmentContainer />
        </AssessmentProvider>
      </div>
    </main>
  );
} 