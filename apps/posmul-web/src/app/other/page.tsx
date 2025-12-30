'use client';

/**
 * Other Services Page
 * 기타 서비스 메인 페이지 - Forum 스타일 다크 테마
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gift, BarChart3, MessageCircle, Settings, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/components/base/Card';

interface ServiceCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'active' | 'coming-soon';
  features: string[];
  color: string;
}

function ServiceCard({ href, icon, title, description, status, features, color }: ServiceCardProps) {
  const isActive = status === 'active';

  const content = (
    <Card className={`bg-slate-900/70 border-slate-800 transition-all h-full ${isActive
      ? 'hover:border-slate-600 cursor-pointer group'
      : 'opacity-50 cursor-not-allowed'
      }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center text-white`}>
            {icon}
          </div>
          {status === 'coming-soon' && (
            <span className="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded-full">
              Coming Soon
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 mb-4 text-sm">{description}</p>
        <ul className="space-y-2 mb-4">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center text-sm text-slate-500">
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
              {feature}
            </li>
          ))}
        </ul>
        {isActive && (
          <div className="flex items-center text-sm text-slate-500 group-hover:text-white transition-colors">
            바로가기 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Link href={href}>{content}</Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {content}
    </motion.div>
  );
}

export default function OtherServicesPage() {
  const services: ServiceCardProps[] = [
    {
      href: '/other/gift-aid',
      icon: <Gift className="w-6 h-6" />,
      title: 'Gift Aid',
      description: '기부금 세액공제 관련 서비스입니다.',
      status: 'active',
      color: 'from-purple-500 to-pink-500',
      features: [
        '기부금 영수증 발급',
        '연말정산용 자료 제공',
        '세액공제 예상 금액 계산',
        '기부 내역 조회',
      ],
    },
    {
      href: '/other/tax',
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Accounting & Tax',
      description: '회계 및 세무 관련 서비스입니다.',
      status: 'active',
      color: 'from-blue-500 to-cyan-500',
      features: [
        '포인트 거래 내역 조회',
        'PMC 수익 명세서',
        '세무 신고용 자료',
        '거래 요약 리포트',
      ],
    },
    {
      href: '/other/support',
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Support Center',
      description: '고객 지원 및 문의 서비스입니다.',
      status: 'coming-soon',
      color: 'from-emerald-500 to-teal-500',
      features: [
        '1:1 문의',
        'FAQ',
        '가이드 문서',
        '피드백 제출',
      ],
    },
    {
      href: '/other/settings',
      icon: <Settings className="w-6 h-6" />,
      title: 'Account Settings',
      description: '계정 및 환경 설정입니다.',
      status: 'coming-soon',
      color: 'from-amber-500 to-orange-500',
      features: [
        '프로필 수정',
        '알림 설정',
        '보안 설정',
        '연동 계정 관리',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-200">
      {/* Header - Forum 스타일 */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-100">
                ⚡ 기타 서비스
              </h1>
              <p className="text-sm text-slate-400">Gift Aid · 세무 · 설정</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">이용 가능</p>
              <p className="text-xl font-bold text-white">
                <span className="text-2xl">2</span>
                <span className="text-sm ml-1">서비스</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 서비스 그리드 */}
        <div className="grid md:grid-cols-2 gap-4">
          {services.map((service) => (
            <ServiceCard key={service.href} {...service} />
          ))}
        </div>

        {/* 안내 문구 */}
        <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-4">
          <h3 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
            💡 안내
          </h3>
          <p className="text-blue-300/70 text-sm">
            Gift Aid와 Accounting & Tax 서비스는 현재 기본 기능만 제공됩니다.
            향후 업데이트를 통해 더 많은 기능이 추가될 예정입니다.
          </p>
        </div>
      </main>
    </div>
  );
}
