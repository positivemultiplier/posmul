'use client';

/**
 * Other Services Page
 * 기타 서비스 메인 페이지 - Gift Aid, Accounting & Tax 등
 */

import Link from 'next/link';

interface ServiceCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  status: 'active' | 'coming-soon';
  features: string[];
}

function ServiceCard({ href, icon, title, description, status, features }: ServiceCardProps) {
  const isActive = status === 'active';
  
  const CardContent = () => (
    <div
      className={`bg-white rounded-lg p-6 border-2 transition-all ${
        isActive
          ? 'border-gray-200 hover:border-blue-400 hover:shadow-lg cursor-pointer'
          : 'border-gray-100 opacity-70 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-4xl">{icon}</span>
        {status === 'coming-soon' && (
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
            Coming Soon
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center text-sm text-gray-500">
            <span className="mr-2 text-green-500">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );

  if (isActive) {
    return (
      <Link href={href}>
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}

export default function OtherServicesPage() {
  const services: ServiceCardProps[] = [
    {
      href: '/other/gift-aid',
      icon: '🎁',
      title: 'Gift Aid',
      description: '기부금 세액공제 관련 서비스입니다.',
      status: 'active',
      features: [
        '기부금 영수증 발급',
        '연말정산용 자료 제공',
        '세액공제 예상 금액 계산',
        '기부 내역 조회',
      ],
    },
    {
      href: '/other/tax',
      icon: '📊',
      title: 'Accounting & Tax',
      description: '회계 및 세무 관련 서비스입니다.',
      status: 'active',
      features: [
        '포인트 거래 내역 조회',
        'PMC 수익 명세서',
        '세무 신고용 자료',
        '거래 요약 리포트',
      ],
    },
    {
      href: '/other/support',
      icon: '💬',
      title: 'Support Center',
      description: '고객 지원 및 문의 서비스입니다.',
      status: 'coming-soon',
      features: [
        '1:1 문의',
        'FAQ',
        '가이드 문서',
        '피드백 제출',
      ],
    },
    {
      href: '/other/settings',
      icon: '⚙️',
      title: 'Account Settings',
      description: '계정 및 환경 설정입니다.',
      status: 'coming-soon',
      features: [
        '프로필 수정',
        '알림 설정',
        '보안 설정',
        '연동 계정 관리',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">⚡ 기타 서비스</h1>
          <p className="text-gray-300">
            Gift Aid, 회계, 세무 및 기타 유틸리티 서비스를 이용하세요.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 서비스 그리드 */}
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.href} {...service} />
          ))}
        </div>

        {/* 안내 문구 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">💡 안내</h3>
          <p className="text-blue-700 text-sm">
            Gift Aid와 Accounting & Tax 서비스는 현재 기본 기능만 제공됩니다.
            향후 업데이트를 통해 더 많은 기능이 추가될 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
