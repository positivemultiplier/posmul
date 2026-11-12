'use client';

/**
 * Other Services Page
 * 기타 서비스 메인 페이지 - Cool Slate Tone-on-Tone
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gift, BarChart3, MessageCircle, Settings, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/components/base/Card';
import { DomainContextHeader } from '@/shared/ui/components/layout/DomainContextHeader';

interface ServiceCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'active' | 'coming-soon';
  features: string[];
}

function ServiceCard({ href, icon, title, description, status, features }: ServiceCardProps) {
  const isActive = status === 'active';

  const content = (
    <Card
      className={`bg-slate-900/70 border-slate-800/90 transition-all h-full ${
        isActive
          ? 'hover:border-slate-500/50 cursor-pointer group'
          : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
            {icon}
          </div>
          {status === 'coming-soon' && (
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700">
              준비 중
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-slate-200">
          {title}
        </h3>
        <p className="text-slate-400 mb-4 text-sm">{description}</p>
        <ul className="space-y-2 mb-4">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center text-sm text-slate-400">
              <CheckCircle className="w-4 h-4 mr-2 text-slate-300" />
              {feature}
            </li>
          ))}
        </ul>
        {isActive && (
          <div className="flex items-center text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
            바로가기 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Link href={href}>{content}</Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
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
      title: '🎁 Gift Aid (기부금 세액공제)',
      description: '시민 직접 예산 집행(PMC 기부) 내역의 영수증 발급 및 연말정산 세액공제 계산 서비스입니다.',
      status: 'active',
      features: [
        '기부금 영수증 즉시 발급',
        '연말정산 국세청 제출 자료 제공',
        '연 소득 대비 세액공제 예상액 시뮬레이터',
        '연도별 투명 기부 내역 조회',
      ],
    },
    {
      href: '/other/tax',
      icon: <BarChart3 className="w-6 h-6" />,
      title: '📊 Accounting & Tax (세무·회계)',
      description: 'PMP·PMC 자산 획득 및 사용 내역을 투명하게 검증하고 명세서를 출력하는 회계 서비스입니다.',
      status: 'active',
      features: [
        'PMP / PMC 전체 거래 원장 조회',
        '예측·소비·기부 도메인별 명세서',
        '세무 신고용 PDF / Excel 자료 다운로드',
        '기간별 자산 흐름 요약 리포트',
      ],
    },
    {
      href: '/other/support',
      icon: <MessageCircle className="w-6 h-6" />,
      title: '💬 Support Center (시민 지원)',
      description: '플랫폼 이용 가이드 및 1:1 문의, 시민 건의사항 접수 센터입니다.',
      status: 'coming-soon',
      features: [
        '1:1 시민 문의',
        'PMP · PMC 경제 시스템 FAQ',
        '직접민주주의 참여 가이드 문서',
        '플랫폼 개선 피드백 제출',
      ],
    },
    {
      href: '/other/settings',
      icon: <Settings className="w-6 h-6" />,
      title: '⚙️ Account Settings (계정·환경)',
      description: '동네(읍·면·동) 인증, 직업군 설정 및 알림·보안 환경을 관리합니다.',
      status: 'coming-soon',
      features: [
        '동네(읍·면·동) 및 직업군 프로필 관리',
        '예측 정산 · 공론장 투표 알림 설정',
        '2단계 보안 및 지갑 연동 관리',
        '개인정보 투명성 관리',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <DomainContextHeader
          domain="other"
          title="⚡ Services · 투명 회계 & 시민 지원"
          subtitle="기부금 세액공제(Gift Aid) 영수증 발급과 PMP/PMC 거래 명세서를 투명하게 확인하세요"
          metrics={[{ label: '활성 인프라', value: 2, unit: '서비스' }]}
        />

        <div className="grid md:grid-cols-2 gap-5">
          {services.map((service) => (
            <ServiceCard key={service.href} {...service} />
          ))}
        </div>
      </div>
    </div>
  );
}
