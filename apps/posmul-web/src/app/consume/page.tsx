import Link from "next/link";

export default function ConsumePage() {
  const cards = [
    {
      href: "/consume/time",
      title: "⏰ TimeConsume",
      description: "광고 시청/설문 참여로 PMP 획득",
    },
    {
      href: "/consume/money",
      title: "💳 MoneyConsume",
      description: "지역 매장에서 소비하고 PMC 획득",
    },
    {
      href: "/consume/cloud",
      title: "☁️ CloudConsume",
      description: "프로젝트 후원으로 PMC 획득",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Consume</h1>
        <p className="text-gray-600 mt-2">원하는 소비 방식을 선택하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block rounded-xl border bg-white p-6 hover:shadow-sm transition-shadow"
          >
            <div className="text-xl font-semibold text-gray-900">{card.title}</div>
            <div className="text-sm text-gray-600 mt-2">{card.description}</div>
          </Link>
        ))}
      </div>

      <div>
        <Link href="/prediction" className="text-sm text-gray-500 hover:text-gray-700">
          ← Expect(예측)으로 이동
        </Link>
      </div>
    </div>
  );
}
