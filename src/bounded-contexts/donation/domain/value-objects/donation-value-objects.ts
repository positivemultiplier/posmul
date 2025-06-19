/**
 * Donation Domain Value Objects
 * 기부 도메인의 값 객체들
 */

// 기부 식별자
export class DonationId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('DonationId cannot be empty');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: DonationId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static generate(): DonationId {
    return new DonationId(`donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }
}

// 기관 식별자
export class InstituteId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('InstituteId cannot be empty');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: InstituteId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static generate(): InstituteId {
    return new InstituteId(`institute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }
}

// 오피니언 리더 식별자
export class OpinionLeaderId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('OpinionLeaderId cannot be empty');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OpinionLeaderId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static generate(): OpinionLeaderId {
    return new OpinionLeaderId(`leader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }
}

// 증명서 식별자
export class CertificateId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('CertificateId cannot be empty');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: CertificateId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static generate(): CertificateId {
    return new CertificateId(`cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }
}

// 기부 금액
export class DonationAmount {
  private static readonly MIN_AMOUNT = 1000; // 최소 기부 금액 1,000원

  constructor(private readonly amount: number) {
    if (amount < DonationAmount.MIN_AMOUNT) {
      throw new Error(`Donation amount must be at least ${DonationAmount.MIN_AMOUNT}`);
    }
    if (amount % 100 !== 0) {
      throw new Error('Donation amount must be in units of 100');
    }
  }

  getValue(): number {
    return this.amount;
  }

  equals(other: DonationAmount): boolean {
    return this.amount === other.amount;
  }

  // 포인트 계산 (1,000원당 10포인트)
  calculateRewardPoints(): number {
    return Math.floor(this.amount / 1000) * 10;
  }

  // 금액 더하기
  add(other: DonationAmount): DonationAmount {
    return new DonationAmount(this.amount + other.amount);
  }

  // 금액 비교
  isGreaterThan(other: DonationAmount): boolean {
    return this.amount > other.amount;
  }

  isLessThan(other: DonationAmount): boolean {
    return this.amount < other.amount;
  }

  // 포맷팅
  toFormattedString(): string {
    return `${this.amount.toLocaleString('ko-KR')}원`;
  }

  static getMinimumAmount(): number {
    return DonationAmount.MIN_AMOUNT;
  }
}

// 기부 카테고리
export enum DonationCategory {
  CLOTHING = 'CLOTHING',        // 의류
  FOOD = 'FOOD',               // 식품
  HOUSING = 'HOUSING',         // 주거
  MEDICAL = 'MEDICAL',         // 의료
  EDUCATION = 'EDUCATION',     // 교육
  OTHER = 'OTHER'              // 기타
}

export const DONATION_CATEGORY_LABELS: Record<DonationCategory, string> = {
  [DonationCategory.CLOTHING]: '의류',
  [DonationCategory.FOOD]: '식품',
  [DonationCategory.HOUSING]: '주거',
  [DonationCategory.MEDICAL]: '의료',
  [DonationCategory.EDUCATION]: '교육',
  [DonationCategory.OTHER]: '기타'
};

// 기부 상태
export enum DonationStatus {
  PENDING = 'PENDING',         // 대기 중
  PROCESSING = 'PROCESSING',   // 처리 중
  COMPLETED = 'COMPLETED',     // 완료
  CANCELLED = 'CANCELLED',     // 취소
  FAILED = 'FAILED'           // 실패
}

export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  [DonationStatus.PENDING]: '대기 중',
  [DonationStatus.PROCESSING]: '처리 중',
  [DonationStatus.COMPLETED]: '완료',
  [DonationStatus.CANCELLED]: '취소',
  [DonationStatus.FAILED]: '실패'
};

// 기관 카테고리
export enum InstituteCategory {
  EMERGENCY_RELIEF = 'EMERGENCY_RELIEF',      // 긴급구호
  CHILD_WELFARE = 'CHILD_WELFARE',            // 아동복지
  INTERNATIONAL_AID = 'INTERNATIONAL_AID',    // 국제구호
  ENVIRONMENT = 'ENVIRONMENT',                // 환경보호
  EDUCATION = 'EDUCATION'                     // 교육지원
}

export const INSTITUTE_CATEGORY_LABELS: Record<InstituteCategory, string> = {
  [InstituteCategory.EMERGENCY_RELIEF]: '긴급구호',
  [InstituteCategory.CHILD_WELFARE]: '아동복지',
  [InstituteCategory.INTERNATIONAL_AID]: '국제구호',
  [InstituteCategory.ENVIRONMENT]: '환경보호',
  [InstituteCategory.EDUCATION]: '교육지원'
};

// 후원 카테고리
export enum SupportCategory {
  ENVIRONMENT = 'ENVIRONMENT',     // 환경
  WELFARE = 'WELFARE',            // 복지
  SCIENCE = 'SCIENCE',            // 과학
  HUMAN_RIGHTS = 'HUMAN_RIGHTS',  // 인권
  EDUCATION = 'EDUCATION',        // 교육
  OTHER = 'OTHER'                 // 기타
}

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  [SupportCategory.ENVIRONMENT]: '환경',
  [SupportCategory.WELFARE]: '복지',
  [SupportCategory.SCIENCE]: '과학',
  [SupportCategory.HUMAN_RIGHTS]: '인권',
  [SupportCategory.EDUCATION]: '교육',
  [SupportCategory.OTHER]: '기타'
};

// 기부 유형
export enum DonationType {
  DIRECT = 'DIRECT',                    // 직접 기부
  INSTITUTE = 'INSTITUTE',              // 기관 기부
  OPINION_LEADER = 'OPINION_LEADER'     // 오피니언 리더 후원
}

export const DONATION_TYPE_LABELS: Record<DonationType, string> = {
  [DonationType.DIRECT]: '직접 기부',
  [DonationType.INSTITUTE]: '기관 기부',
  [DonationType.OPINION_LEADER]: '오피니언 리더 후원'
};

// 기부 빈도
export enum DonationFrequency {
  ONE_TIME = 'ONE_TIME',     // 일회성
  MONTHLY = 'MONTHLY',       // 월별
  QUARTERLY = 'QUARTERLY',   // 분기별
  YEARLY = 'YEARLY'          // 연별
}

export const DONATION_FREQUENCY_LABELS: Record<DonationFrequency, string> = {
  [DonationFrequency.ONE_TIME]: '일회성',
  [DonationFrequency.MONTHLY]: '월별',
  [DonationFrequency.QUARTERLY]: '분기별',
  [DonationFrequency.YEARLY]: '연별'
};

// 기부자 등급
export enum DonorTier {
  BRONZE = 'BRONZE',       // 브론즈 (연 5만원 이상)
  SILVER = 'SILVER',       // 실버 (연 20만원 이상)
  GOLD = 'GOLD',          // 골드 (연 50만원 이상)
  PLATINUM = 'PLATINUM',   // 플래티넘 (연 100만원 이상)
  DIAMOND = 'DIAMOND'      // 다이아몬드 (연 500만원 이상)
}

export const DONOR_TIER_LABELS: Record<DonorTier, string> = {
  [DonorTier.BRONZE]: '브론즈',
  [DonorTier.SILVER]: '실버',
  [DonorTier.GOLD]: '골드',
  [DonorTier.PLATINUM]: '플래티넘',
  [DonorTier.DIAMOND]: '다이아몬드'
};

export const DONOR_TIER_THRESHOLDS: Record<DonorTier, number> = {
  [DonorTier.BRONZE]: 50000,
  [DonorTier.SILVER]: 200000,
  [DonorTier.GOLD]: 500000,
  [DonorTier.PLATINUM]: 1000000,
  [DonorTier.DIAMOND]: 5000000
};

// 기부자 등급 계산
export class DonorRating {
  constructor(private readonly tier: DonorTier) {}

  getTier(): DonorTier {
    return this.tier;
  }

  getLabel(): string {
    return DONOR_TIER_LABELS[this.tier];
  }

  getBonusRate(): number {
    switch (this.tier) {
      case DonorTier.BRONZE:
        return 1.1; // 10% 보너스
      case DonorTier.SILVER:
        return 1.2; // 20% 보너스
      case DonorTier.GOLD:
        return 1.3; // 30% 보너스
      case DonorTier.PLATINUM:
        return 1.5; // 50% 보너스
      case DonorTier.DIAMOND:
        return 2.0; // 100% 보너스
      default:
        return 1.0;
    }
  }

  static calculateTier(annualDonationAmount: number): DonorRating {
    if (annualDonationAmount >= DONOR_TIER_THRESHOLDS[DonorTier.DIAMOND]) {
      return new DonorRating(DonorTier.DIAMOND);
    } else if (annualDonationAmount >= DONOR_TIER_THRESHOLDS[DonorTier.PLATINUM]) {
      return new DonorRating(DonorTier.PLATINUM);
    } else if (annualDonationAmount >= DONOR_TIER_THRESHOLDS[DonorTier.GOLD]) {
      return new DonorRating(DonorTier.GOLD);
    } else if (annualDonationAmount >= DONOR_TIER_THRESHOLDS[DonorTier.SILVER]) {
      return new DonorRating(DonorTier.SILVER);
    } else if (annualDonationAmount >= DONOR_TIER_THRESHOLDS[DonorTier.BRONZE]) {
      return new DonorRating(DonorTier.BRONZE);
    } else {
      return new DonorRating(DonorTier.BRONZE);
    }
  }
}

// 기부 설명
export class DonationDescription {
  private static readonly MAX_LENGTH = 500;

  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Donation description cannot be empty');
    }
    if (value.length > DonationDescription.MAX_LENGTH) {
      throw new Error(`Donation description cannot exceed ${DonationDescription.MAX_LENGTH} characters`);
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: DonationDescription): boolean {
    return this.value === other.value;
  }

  getLength(): number {
    return this.value.length;
  }

  static getMaxLength(): number {
    return DonationDescription.MAX_LENGTH;
  }
}

// 수혜자 정보
export class BeneficiaryInfo {
  constructor(
    private readonly name: string,
    private readonly description: string,
    private readonly contactInfo?: string
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error('Beneficiary name cannot be empty');
    }
    if (!description || description.trim().length === 0) {
      throw new Error('Beneficiary description cannot be empty');
    }
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getContactInfo(): string | undefined {
    return this.contactInfo;
  }

  equals(other: BeneficiaryInfo): boolean {
    return this.name === other.name && 
           this.description === other.description &&
           this.contactInfo === other.contactInfo;
  }
}
