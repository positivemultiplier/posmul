'use client';

import { updateTextbookAction } from "@/app/actions/textbook-actions";
import { TextbookResponseDto } from "@/bounded-contexts/study_cycle/application/dto/textbook.dto";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400">
            {pending ? 'Updating...' : 'Update Textbook'}
        </button>
    );
}

export default function UpdateTextbookForm({ textbook }: { textbook: TextbookResponseDto }) {
    const initialState = { success: false, error: '', data: null };
    const [state, dispatch] = useActionState(updateTextbookAction, initialState);

    return (
        <form action={dispatch} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <input type="hidden" name="id" value={textbook.id} />
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                    New Title
                </label>
                <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="title"
                    name="title"
                    type="text"
                    defaultValue={textbook.title}
                    required
                />
            </div>
            
            <div className="flex items-center justify-between">
                <SubmitButton />
            </div>

            {state?.error && (
                <p className="mt-4 text-red-500 text-xs italic">{state.error}</p>
            )}
             {state?.success && state.data && (
                <p className="mt-4 text-green-500 text-xs italic">Textbook updated successfully!</p>
            )}
        </form>
    );
} 