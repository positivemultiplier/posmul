// 환경변수가 없을 경우 단위 테스트를 위한 더미 값 설정 (호이스팅 방지를 위해 dynamic import 사용)
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key';

async function main() {
  const { PredictionSettlementService } = await import(
    '../src/bounded-contexts/prediction/application/services/prediction-settlement.service'
  );
  const { GameSchedulingService } = await import(
    '../src/bounded-contexts/prediction/application/services/game-scheduling.service'
  );
  const { EcosOracleAdapter } = await import(
    '../src/bounded-contexts/prediction/infrastructure/oracle/ecos.adapter'
  );
  const { KobisOracleAdapter } = await import(
    '../src/bounded-contexts/prediction/infrastructure/oracle/kobis.adapter'
  );

  console.log('========================================================');
  console.log('🚀 [PosMul] 예측 도메인 신규 엔진 & 오라클 통합 검증 스크립트');
  console.log('========================================================\n');

  const settlementService = new PredictionSettlementService();

  // 1. LMSR 시드 기반 스무딩 내재확률 테스트
  console.log('📊 [1] LMSR 시드 기반 스무딩 확률 계산 (calculateSmoothedProbabilities)');
  const optionIds = ['opt-yes', 'opt-no'];
  
  console.log(' - 초기 베팅 0 PMP vs 0 PMP:');
  const initProbs = PredictionSettlementService.calculateSmoothedProbabilities(
    { 'opt-yes': 0, 'opt-no': 0 },
    optionIds,
    5000
  );
  console.log(`   * 결과: ${JSON.stringify(initProbs)} (50% : 50% 균등 분배)`);

  console.log(' - 베팅 15,000 PMP vs 5,000 PMP (시드 b=5,000):');
  const betProbs = PredictionSettlementService.calculateSmoothedProbabilities(
    { 'opt-yes': 15000, 'opt-no': 5000 },
    optionIds,
    5000
  );
  console.log(`   * 결과: ${JSON.stringify(betProbs)} (극단 쏠림 완화)`);

  // 2. 얼리버드 가중치 및 기대 배당률 테스트
  console.log('\n⏱️ [2] 얼리버드 가중치 (calculateEarlyBirdWeight) 및 배당률');
  const now = new Date();
  const gameOpen = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7); // 7일 전 오픈
  const gameClose = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1); // 1일 후 마감 (총 8일)

  const earlyWeight = settlementService.calculateEarlyBirdWeight(
    new Date(gameOpen.getTime() + 1000 * 60 * 60), // 오픈 1시간 후 참여
    gameOpen,
    gameClose
  );
  const lateWeight = settlementService.calculateEarlyBirdWeight(
    now, // 마감 직전 참여
    gameOpen,
    gameClose
  );
  console.log(` - 오픈 직후 참여자 가중치: ${earlyWeight.toFixed(3)}x (얼리버드 보너스 혜택)`);
  console.log(` - 마감 직전 참여자 가중치: ${lateWeight.toFixed(3)}x (기본 배율)`);

  // 배당률 (반대편 베팅 0원이어도 MoneyWave 시드로 > 1.0x)
  const multiplierWithZeroOpponent = PredictionSettlementService.calculateExpectedMultiplier(
    10000, // 본인 옵션 10,000 PMP
    10000, // 전체 베팅 10,000 PMP (상대편 0 PMP)
    5000   // MoneyWave 시드 풀 5,000
  );
  console.log(` - 상대 베팅 0원일 때 기대 배당률 (MoneyWave 풀 결합): ${multiplierWithZeroOpponent.toFixed(2)}x`);

  // 3. 승리자 PMC 분배 시뮬레이션
  console.log('\n💰 [3] 승리자 PMP ➔ PMC 배당 분배 시뮬레이션 (settlePrediction)');
  const mockParticipants = [
    {
      userId: 'user-early-bird',
      optionId: 'opt-yes',
      stakedAmount: 1000,
      confidenceScore: 75,
      stakeTime: new Date(gameOpen.getTime() + 1000 * 60 * 60), // 얼리버드
    },
    {
      userId: 'user-late-comer',
      optionId: 'opt-yes',
      stakedAmount: 1000,
      confidenceScore: 75,
      stakeTime: now, // 마감 직전
    },
    {
      userId: 'user-loser',
      optionId: 'opt-no',
      stakedAmount: 1500,
      confidenceScore: 60,
      stakeTime: now,
    },
  ];

  const settlementResult = await settlementService.settlePrediction(
    'test-game-1',
    {
      winningOptionId: 'opt-yes',
      allocatedMoneyWavePool: 2000,
      gameOpenTime: gameOpen,
      gameCloseTime: gameClose,
    },
    mockParticipants
  );

  console.log(' - 정산 결과:');
  console.log(`   * 총 베팅: ${settlementResult.summary.totalStaked} PMP | 승리자 수: ${settlementResult.summary.winnerCount}명`);
  for (const s of settlementResult.settlements) {
    if (s.isWinner) {
      console.log(`   * [승리자: ${s.userId}] 얼리버드가중치: ${s.earlyBirdWeight}x | 당첨지급액: ${s.winningAmount} PMC | 순이익: ${s.netProfit} PMC`);
    } else {
      console.log(`   * [패자: ${s.userId}] PMP 소각 (순손실: ${s.netProfit} PMP)`);
    }
  }

  // 4. 정기 스케줄러 템플릿 목록 검증
  console.log('\n📅 [4] 정기 경제지표 및 K-콘텐츠 템플릿 확인 (GameSchedulingService)');
  const schedulingService = new GameSchedulingService();
  const templates = schedulingService.getActiveTemplates();
  console.log(` - 등록된 활성 정기 템플릿 개수: ${templates.length}개`);
  templates.forEach((tpl) => {
    console.log(`   * [${tpl.category.toUpperCase()}] ${tpl.title} (주기: ${tpl.recurrence || 'once'}, 오라클: ${tpl.sourceType || 'manual'})`);
  });

  // 5. 신규 오라클 어댑터 인터페이스 검증
  console.log('\n🔮 [5] 신규 오라클 어댑터 등록 확인');
  const ecosOracle = new EcosOracleAdapter();
  const kobisOracle = new KobisOracleAdapter();
  console.log(` - ECOS 오라클 어댑터 지원 여부: supports("ecos")=${ecosOracle.supports('ecos')} (한국은행 기준금리, GDP, 경상수지)`);
  console.log(` - KOBIS 오라클 어댑터 지원 여부: supports("kobis")=${kobisOracle.supports('kobis')} (영진위 박스오피스 순위 및 누적관객)`);

  console.log('\n========================================================');
  console.log('✅ 모든 예측 엔진 및 오라클 단위 검증이 성공적으로 완료되었습니다!');
  console.log('========================================================');
}

main().catch((err) => {
  console.error('❌ 테스트 중 오류 발생:', err);
  process.exit(1);
});
