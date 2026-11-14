import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import {
  OracleResult,
  SettlementSource,
} from "../../domain/value-objects/settlement-types";

export type KrPublicSubType =
  | "kma_village_weather"
  | "airkorea_clean_air"
  | "local_vitality_ranking"
  | "living_price_stability";

export interface KrPublicSourceConfig {
  subType?: KrPublicSubType;
  subCategory?: string;
  regionLevel?: "NATION" | "REGION" | "LOCAL" | "DONG";
  regionCode?: string;
  regionName?: string;
  lat?: number;
  lon?: number;
  minTemp?: number;
  maxTemp?: number;
  maxPrecipitationMm?: number;
  pm25GoodThreshold?: number;
  verifiedOptionId?: string;
  verifiedValue?: number;
}

interface OpenMeteoForecastResponse {
  daily?: {
    time?: string[];
    temperature_2m_max?: Array<number | null>;
    precipitation_sum?: Array<number | null>;
  };
}

interface OpenMeteoAirQualityResponse {
  current?: {
    time?: string;
    pm2_5?: number | null;
    pm10?: number | null;
  };
}

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * 타임아웃이 적용된 JSON fetch 헬퍼
 */
async function fetchJsonWithTimeout<T>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 한국 공공데이터(기상청 KMA 동네예보, 에어코리아 대기질, 통계청 지역활력, 오피넷·소비자원 물가안정)
 * 긍정 프레이밍(Positive Multiplier) 자동 판정 오라클 어댑터
 */
export class KrPublicDataOracleAdapter implements IOracleProvider {
  public supports(sourceType: string): boolean {
    return sourceType === "kr_public";
  }

  public async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
    const cfg = (source.sourceConfig ?? {}) as KrPublicSourceConfig;
    const subType = cfg.subType ?? "kma_village_weather";

    // 운영자/배치 검증 완료 옵션 ID가 등록된 경우 최우선 판정
    if (typeof cfg.verifiedOptionId === "string" && cfg.verifiedOptionId.trim() !== "") {
      return {
        winningOptionId: cfg.verifiedOptionId.trim(),
        sourceData: {
          provider: "kr_public_verified",
          subType,
          regionCode: cfg.regionCode ?? "KR",
          regionName: cfg.regionName ?? "대한민국",
          verifiedValue: cfg.verifiedValue ?? null,
        },
        confidence: 0.95,
        fetchedAt: new Date(),
      };
    }

    switch (subType) {
      case "kma_village_weather":
        return this.resolveVillageWeather(cfg);
      case "airkorea_clean_air":
        return this.resolveCleanAir(cfg);
      case "living_price_stability":
        return this.resolveLivingPriceStability(cfg);
      case "local_vitality_ranking":
      default:
        return null;
    }
  }

  /**
   * 읍면동(DONG) 나들이 쾌청 날씨 달성 여부 판정 (기온 12~26도 & 강수 5mm 미만)
   */
  private async resolveVillageWeather(
    cfg: KrPublicSourceConfig
  ): Promise<OracleResult | null> {
    const minTemp = cfg.minTemp ?? 12;
    const maxTemp = cfg.maxTemp ?? 27;
    const maxRainMm = cfg.maxPrecipitationMm ?? 5;

    // 수동 검증값(강수 0 가정 최고기온)이 제공된 경우 즉시 판정
    if (typeof cfg.verifiedValue === "number" && Number.isFinite(cfg.verifiedValue)) {
      const pleasant = cfg.verifiedValue >= minTemp && cfg.verifiedValue <= maxTemp;
      return {
        winningOptionId: pleasant ? "yes" : "no",
        sourceData: {
          provider: "kr_public_kma_verified",
          regionName: cfg.regionName ?? "우리동네",
          observedMaxTemp: cfg.verifiedValue,
          minTemp,
          maxTemp,
        },
        confidence: 0.95,
        fetchedAt: new Date(),
      };
    }

    const lat = typeof cfg.lat === "number" ? cfg.lat : 35.216;
    const lon = typeof cfg.lon === "number" ? cfg.lon : 126.845;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,precipitation_sum&timezone=Asia%2FSeoul&forecast_days=3`;

    try {
      const data = await fetchJsonWithTimeout<OpenMeteoForecastResponse>(url);
      const maxTemps = data.daily?.temperature_2m_max ?? [];
      const rains = data.daily?.precipitation_sum ?? [];
      const observedTemp = maxTemps[0];
      const observedRain = rains[0] ?? 0;

      if (typeof observedTemp !== "number" || !Number.isFinite(observedTemp)) {
        return null;
      }

      const isPleasant =
        observedTemp >= minTemp && observedTemp <= maxTemp && observedRain < maxRainMm;

      return {
        winningOptionId: isPleasant ? "yes" : "no",
        sourceData: {
          provider: "open_meteo_kma_korea",
          regionName: cfg.regionName ?? "우리동네",
          lat,
          lon,
          observedMaxTemp: observedTemp,
          observedPrecipitationMm: observedRain,
          criteria: { minTemp, maxTemp, maxRainMm },
        },
        confidence: 0.92,
        fetchedAt: new Date(),
      };
    } catch (err) {
      console.warn(
        "[KrPublicDataOracle] village weather fetch failed:",
        err instanceof Error ? err.message : String(err)
      );
      return null;
    }
  }

  /**
   * 우리 시/구 맑은하늘(PM2.5 <= 35㎍/㎥) 대기질 달성 여부 판정
   */
  private async resolveCleanAir(
    cfg: KrPublicSourceConfig
  ): Promise<OracleResult | null> {
    const threshold = cfg.pm25GoodThreshold ?? 35;

    if (typeof cfg.verifiedValue === "number" && Number.isFinite(cfg.verifiedValue)) {
      const isClean = cfg.verifiedValue <= threshold;
      return {
        winningOptionId: isClean ? "yes" : "no",
        sourceData: {
          provider: "kr_public_airkorea_verified",
          regionName: cfg.regionName ?? "우리시",
          observedPm25: cfg.verifiedValue,
          threshold,
        },
        confidence: 0.95,
        fetchedAt: new Date(),
      };
    }

    const lat = typeof cfg.lat === "number" ? cfg.lat : 35.1595;
    const lon = typeof cfg.lon === "number" ? cfg.lon : 126.8526;
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
      `&current=pm2_5,pm10&timezone=Asia%2FSeoul`;

    try {
      const data = await fetchJsonWithTimeout<OpenMeteoAirQualityResponse>(url);
      const pm25 = data.current?.pm2_5;
      if (typeof pm25 !== "number" || !Number.isFinite(pm25)) {
        return null;
      }

      return {
        winningOptionId: pm25 <= threshold ? "yes" : "no",
        sourceData: {
          provider: "open_meteo_air_quality",
          regionName: cfg.regionName ?? "우리시",
          lat,
          lon,
          observedPm25: pm25,
          observedPm10: data.current?.pm10 ?? null,
          threshold,
        },
        confidence: 0.9,
        fetchedAt: new Date(),
      };
    } catch (err) {
      console.warn(
        "[KrPublicDataOracle] clean air fetch failed:",
        err instanceof Error ? err.message : String(err)
      );
      return null;
    }
  }

  /**
   * 전국 생활물가(주유·장바구니) 주간 변동률 기반 3지선다 안정세 판정
   */
  private resolveLivingPriceStability(cfg: KrPublicSourceConfig): OracleResult | null {
    if (typeof cfg.verifiedValue !== "number" || !Number.isFinite(cfg.verifiedValue)) {
      return null;
    }

    const weeklyChangePct = cfg.verifiedValue;
    const winningOptionId =
      weeklyChangePct <= -0.1 ? "down" : weeklyChangePct <= 0.5 ? "flat" : "up";

    return {
      winningOptionId,
      sourceData: {
        provider: "kr_public_living_price",
        regionName: cfg.regionName ?? "대한민국",
        weeklyChangePct,
      },
      confidence: 0.95,
      fetchedAt: new Date(),
    };
  }
}
