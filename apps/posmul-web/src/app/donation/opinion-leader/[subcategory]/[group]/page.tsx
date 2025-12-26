
import { redirect } from "next/navigation";

export default async function OpinionLeaderGroupPage({
    params,
}: {
    params: Promise<{ subcategory: string; group: string }>;
}) {
    const { subcategory } = await params;

    // Currently, we treat 'group' mainly as a URL segment for structure (e.g. 'general').
    // So we just render the category page or redirect.
    // For better UX, let's redirect to the category page for now, 
    // unless we have specific group logic later.
    redirect(`/donation/opinion-leader/${subcategory}`);
}
