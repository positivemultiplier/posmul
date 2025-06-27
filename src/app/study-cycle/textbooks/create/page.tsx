'use client';

import { createTextbookAction } from "@/app/actions/textbook-actions";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400">
            {pending ? 'Creating...' : 'Create Textbook'}
        </button>
    );
}

export default function CreateTextbookPage() {
    const initialState = { success: false, error: '', data: null };
    const [state, dispatch] = useActionState(createTextbookAction, initialState);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Create New Textbook</h1>
            <form action={dispatch} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                        Title
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="title"
                        name="title"
                        type="text"
                        placeholder="Textbook Title"
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
                    <p className="mt-4 text-green-500 text-xs italic">Textbook created successfully!</p>
                )}
            </form>
        </div>
    );
} 