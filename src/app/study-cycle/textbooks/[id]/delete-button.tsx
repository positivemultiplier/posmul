 'use client';

import { deleteTextbookAction } from "@/app/actions/textbook-actions";
import { TextbookId } from "@/bounded-contexts/study_cycle/domain/entities/textbook.entity";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function DeleteTextbookButton({ textbookId }: { textbookId: TextbookId }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this textbook? This action cannot be undone.')) {
            startTransition(async () => {
                const result = await deleteTextbookAction(textbookId);
                if (result.success) {
                    // Redirect to the list page after successful deletion
                    router.push('/study-cycle/textbooks');
                } else {
                    // Handle deletion error (e.g., show a toast notification)
                    alert(`Failed to delete textbook: ${result.error}`);
                }
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
        >
            {isPending ? 'Deleting...' : 'Delete Textbook'}
        </button>
    );
}
