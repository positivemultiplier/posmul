import { GetAssessmentResultUseCase } from "@/bounded-contexts/assessment/application/use-cases/get-assessment-result.use-case";
import { McpSupabaseAssessmentRepository } from "@/bounded-contexts/assessment/infrastructure/repositories/assessment.repository";
import { AssessmentResultDto } from "@/bounded-contexts/assessment/application/dto/assessment-result.dto";
import { createAssessmentId, AssessmentId } from "@/bounded-contexts/assessment/domain/value-objects/assessment-id.value-object";
import { createUserId, UserId } from "@/shared/types/branded-types";

// Helper function to format time
const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0s";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min > 0 ? `${min}m ` : ''}${sec}s`;
};

// This is a placeholder for your actual Supabase project ID
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID as string;

async function getAssessmentResultData(assessmentId: AssessmentId, userId: UserId): Promise<AssessmentResultDto | null> {
    // This is where you'd instantiate your real dependencies
    // For now, we are creating them on the fly. In a real app, you'd use a dependency injection container.
    const assessmentRepository = new McpSupabaseAssessmentRepository(SUPABASE_PROJECT_ID);
    const getAssessmentResult = new GetAssessmentResultUseCase(assessmentRepository);

    const result = await getAssessmentResult.execute(assessmentId, userId);

    if (result.success) {
        return result.data;
    } else {
        console.error(result.error);
        return null;
    }
}

export default async function AssessmentResultPage({ params }: { params: { assessmentId: string } }) {
    // For demonstration, we're using a hardcoded user ID.
    // In a real application, you would get this from the user's session.
    const userId = createUserId("user_2clw1h3Vz5E4A5s6T7U8V9W0X");
    const assessmentId = createAssessmentId(params.assessmentId);

    const resultData = await getAssessmentResultData(assessmentId, userId);

    if (!resultData) {
        return (
            <div className="container mx-auto p-4 text-center">
                <h1 className="text-2xl font-bold text-red-500">Error</h1>
                <p>Could not load assessment results. Please check the console for more details.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="border-b pb-4 mb-4">
                    <h1 className="text-3xl font-bold text-gray-800">{resultData.title}</h1>
                    <p className="text-gray-600 mt-2">{resultData.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
                    <div>
                        <p className="text-sm text-gray-500">Grade</p>
                        <p className="text-2xl font-bold text-blue-600">{resultData.grade}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Score</p>
                        <p className="text-2xl font-bold">{resultData.totalScore} / {resultData.maxScore}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Percentage</p>
                        <p className="text-2xl font-bold">{resultData.percentage.toFixed(1)}%</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Time Taken</p>
                        <p className="text-2xl font-bold">{formatTime(resultData.timeTakenInSeconds)}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Detailed Results</h2>
                <div className="space-y-4">
                    {resultData.questionResults.map((q, index) => (
                        <div key={index} className="bg-white p-5 rounded-lg shadow">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-gray-800">{index + 1}. {q.title}</h3>
                                <span className={`px-3 py-1 text-sm rounded-full font-semibold ${
                                    q.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {q.isCorrect ? 'Correct' : 'Incorrect'} (+{q.score}/{q.maxScore})
                                </span>
                            </div>
                            <p className="text-gray-600 mt-2 mb-4" dangerouslySetInnerHTML={{ __html: q.content }} />
                            
                            <div className="space-y-3">
                                <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                                    <p className="text-sm font-medium text-blue-800">Your Answer</p>
                                    <p className="text-gray-700">{JSON.stringify(q.userAnswer)}</p>
                                </div>
                                {!q.isCorrect && (
                                     <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                                        <p className="text-sm font-medium text-green-800">Correct Answer</p>
                                        <p className="text-gray-700">{JSON.stringify(q.correctAnswer)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 