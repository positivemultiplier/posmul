import { McpSupabaseTextbookRepository } from "@/bounded-contexts/study_cycle/infrastructure/repositories/mcp-supabase-textbook.repository";
import Link from 'next/link';

// This would also ideally use a "findAll" use case, but for simplicity we use the repository directly.
async function getTextbooks() {
    const textbookRepository = new McpSupabaseTextbookRepository();
    // This assumes a 'findAll' method exists, let's add it.
    // For now, let's use findAllByCreator with a dummy creatorId.
    const result = await textbookRepository.findAllByCreator('user-123'); // FIXME: Need a proper findAll or public list
    if (result.success) {
        return result.data;
    }
    return [];
}

export default async function TextbooksPage() {
    const textbooks = await getTextbooks();

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Textbooks</h1>
            <div className="mb-4">
                <Link href="/study-cycle/textbooks/create" className="bg-blue-500 text-white px-4 py-2 rounded">
                    Create Textbook
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {textbooks.map((textbook) => (
                    <div key={textbook.propsAsJson.id} className="border p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold">{textbook.propsAsJson.title}</h2>
                        <p className="text-gray-500">Created by: {textbook.propsAsJson.creatorId}</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Last updated: {new Date(textbook.propsAsJson.updatedAt).toLocaleDateString()}
                        </p>
                        <div className="mt-4">
                            <Link href={`/study-cycle/textbooks/${textbook.propsAsJson.id}`} className="text-blue-500 hover:underline">
                                View Details
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 