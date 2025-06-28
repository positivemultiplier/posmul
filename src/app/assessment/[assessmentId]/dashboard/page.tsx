/**
 * @file app/assessment/[assessmentId]/dashboard/page.tsx
 * @description Server component for displaying the assessment results dashboard.
 * It fetches the assessment results using the use case and passes them
 * down to the client component for rendering.
 */
import 'server-only';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { GetAssessmentResultUseCase } from '@/bounded-contexts/assessment/application/use-cases/get-assessment-result.use-case';
import { McpSupabaseAssessmentRepository } from '@/bounded-contexts/assessment/infrastructure/repositories/mcp-supabase-assessment.repository';
import { AssessmentDashboard } from '@/bounded-contexts/assessment/presentation/components/dashboard/AssessmentDashboard';
import { AssessmentId } from '@/bounded-contexts/assessment/domain/entities/assessment.entity';
import { UserId } from '@/shared/types/branded-types';

interface AssessmentDashboardPageProps {
  params: {
    assessmentId: string;
  };
}

export default async function AssessmentDashboardPage({ params }: AssessmentDashboardPageProps) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const assessmentId = params.assessmentId as AssessmentId;
  const userId = session.user.id as UserId;

  // Dependency Injection - In a real app, this would be handled by a DI container
  const assessmentRepository = new McpSupabaseAssessmentRepository();
  const getAssessmentResultUseCase = new GetAssessmentResultUseCase(assessmentRepository);

  const result = await getAssessmentResultUseCase.execute(assessmentId, userId);

  if (!result.success) {
    // A more sophisticated error page should be rendered here
    return <div>Error: {result.error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <AssessmentDashboard initialData={result.data} />
    </div>
  );
} 