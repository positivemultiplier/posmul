import { getTextbookAction } from "@/app/actions/textbook-actions";
import { TextbookId } from "@/bounded-contexts/study_cycle/domain/entities/textbook.entity";
import UpdateTextbookForm from "./update-form";
import DeleteTextbookButton from "./delete-button";

export default async function TextbookDetailPage({ params }: any) {
    const { id } = await params;
    const textbookId = id as TextbookId;
    const textbookResult = await getTextbookAction(textbookId);

    if (!textbookResult.success || !textbookResult.data) {
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold">Textbook not found</h1>
                <p>{textbookResult.error}</p>
            </div>
        );
    }

    const textbook = textbookResult.data;

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h1 className="text-3xl font-bold mb-2">{textbook.title}</h1>
                <p className="text-gray-600 mb-4">ID: {textbook.id}</p>
                <div className="text-sm text-gray-500">
                    <p>Created by: {textbook.creatorId}</p>
                    <p>Created at: {textbook.createdAt}</p>
                    <p>Last updated: {textbook.updatedAt}</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Update Textbook</h2>
                <UpdateTextbookForm textbook={textbook} />
            </div>

            <div className="mt-8">
                 <h2 className="text-2xl font-bold mb-4">Delete Textbook</h2>
                <DeleteTextbookButton textbookId={textbook.id} />
            </div>
        </div>
    );
} 