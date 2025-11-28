/**
 * Direct Supabase Client
 * MCP 도구 우회를 위한 직접 연결 클라이언트
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 예측 게임 생성 (DDD 스키마 사용)
 */
export async function createPredictionGame(gameData: {
  title: string;
  description: string;
  predictionType: 'binary' | 'wdl' | 'ranking';
  options: Array<{ id: string; label: string; }>;
  startTime: Date;
  endTime: Date;
  settlementTime: Date;
  creatorId: string;
  minimumStake: number;
  maximumStake: number;
  maxParticipants?: number;
}) {
  const { data, error } = await supabase
    .schema('prediction')
    .from('prediction_games')
    .insert({
      id: crypto.randomUUID(),
      title: gameData.title,
      description: gameData.description,
      prediction_type: gameData.predictionType,
      options: gameData.options,
      start_time: gameData.startTime.toISOString(),
      end_time: gameData.endTime.toISOString(),
      settlement_time: gameData.settlementTime.toISOString(),
      creator_id: gameData.creatorId,
      minimum_stake: gameData.minimumStake,
      maximum_stake: gameData.maximumStake,
      max_participants: gameData.maxParticipants,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  return { data, error };
}

/**
 * 예측 게임 목록 조회 (DDD 스키마 사용)
 */
export async function getPredictionGames(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .schema('prediction')
    .from('prediction_games')
    .select('*');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 20) - 1);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  return { data, error };
}

/**
 * 예측 게임 참여 (DDD 스키마 사용)
 */
export async function participateInGame(participationData: {
  userId: string;
  gameId: string;
  selectedOptionId: string;
  stakeAmount: number;
  confidence: number;
}) {
  const predictionId = crypto.randomUUID();

  const { data, error } = await supabase
    .schema('prediction')
    .from('predictions')
    .insert({
      id: predictionId,
      user_id: participationData.userId,
      game_id: participationData.gameId,
      selected_option_id: participationData.selectedOptionId,
      stake_amount: participationData.stakeAmount,
      confidence: participationData.confidence,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return { data, error };
}

/**
 * 사용자 경제 상태 조회 (DDD 스키마 사용)
 */
export async function getUserEconomicBalance(userId: string) {
  const { data: accountData, error } = await supabase
    .schema('economy')
    .from('pmp_pmc_accounts')
    .select('pmp_balance, pmc_balance')
    .eq('user_id', userId)
    .single();

  return {
    pmpBalance: accountData?.pmp_balance || 0,
    pmcBalance: accountData?.pmc_balance || 0,
    error
  };
}

/**
 * 간단한 사용자 생성/조회
 */
export async function getOrCreateUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error && error.message.includes('Invalid login credentials')) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    return { data: signUpData, error: signUpError };
  }

  return { data, error };
}

/**
 * 테스트용 데이터 초기화
 */
export async function initializeTestData() {
  const testUser = {
    email: 'test@posmul.com',
    password: 'test123456'
  };

  const { data: userData, error: userError } = await getOrCreateUser(
    testUser.email,
    testUser.password
  );

  if (userError) {
    console.error('User creation failed:', userError);
    return { success: false, error: userError };
  }

  const userId = userData?.user?.id;
  if (!userId) {
    return { success: false, error: 'No user ID' };
  }

  // Economy 스키마에 계정 초기화
  const { error: accountError } = await supabase
    .schema('economy')
    .from('pmp_pmc_accounts')
    .upsert({
      user_id: userId,
      pmp_balance: 1000,
      pmc_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  return {
    success: true,
    userId,
    errors: { accountError }
  };
}