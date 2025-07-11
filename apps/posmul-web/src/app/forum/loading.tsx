import { BaseSkeleton } from "../../shared/ui";

export default function ForumLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <BaseSkeleton variant="header" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <BaseSkeleton key={i} variant="card" />
        ))}
      </div>
    </div>
  );
}
