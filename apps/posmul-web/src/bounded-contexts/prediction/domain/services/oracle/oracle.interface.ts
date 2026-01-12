import { OracleResult, SettlementSource } from "../../value-objects/settlement-types";


/**
 * Oracle Provider Interface (Domain Port)
 * 외부 데이터 소스로부터 게임 결과를 가져오는 어댑터의 공통 인터페이스
 */
export interface IOracleProvider {
    /**
     * 해당 소스 타입을 지원하는지 확인
     */
    supports(sourceType: string): boolean;

    /**
     * 외부 소스에서 결과를 조회하여 표준 포맷으로 반환
     */
    fetchResult(source: SettlementSource): Promise<OracleResult | null>;
}
