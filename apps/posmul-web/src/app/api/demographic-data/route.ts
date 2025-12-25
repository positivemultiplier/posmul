import { NextRequest, NextResponse } from "next/server";

import { getKOSISClient, KOSISClient } from "@/bounded-contexts/demographic-data/infrastructure";
import { StatCategory } from "@/bounded-contexts/demographic-data/domain";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

interface DemographicDataItem {
  id: string;
  category: StatCategory;
  regionCode: string;
  regionName: string;
  year: number;
  month?: number;
  value: number;
  unit: string;
}

const getRegionName = (regionCode: string): string => {
  const names: Record<string, string> = {
    "29000": "광주광역시",
    "29110": "광주 동구",
    "29140": "광주 서구",
    "29155": "광주 남구",
    "29170": "광주 북구",
    "29200": "광주 광산구",
  };

  return names[regionCode] ?? regionCode;
};

const isStatCategory = (value: string): value is StatCategory => {
  return (Object.values(StatCategory) as string[]).includes(value);
};

/**
 * GET /api/demographic-data
 * Query:
 * - category: StatCategory (required)
 * - regionCode: string (required)
 * - year: number (required)
 * - month: number (optional, 1-12)
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<{ data: DemographicDataItem[] }>>> {
  const { searchParams } = new URL(req.url);

  const categoryRaw = searchParams.get("category");
  const regionCode = searchParams.get("regionCode");
  const yearRaw = searchParams.get("year");
  const monthRaw = searchParams.get("month");

  if (!categoryRaw || !regionCode || !yearRaw) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "invalid_request",
          message: "category, regionCode, year는 필수입니다.",
        },
      },
      { status: 400 }
    );
  }

  if (!isStatCategory(categoryRaw)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "invalid_category",
          message: `지원하지 않는 category 입니다: ${categoryRaw}`,
        },
      },
      { status: 400 }
    );
  }

  const year = Number(yearRaw);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "invalid_year",
          message: `year 값이 올바르지 않습니다: ${yearRaw}`,
        },
      },
      { status: 400 }
    );
  }

  const month = monthRaw ? Number(monthRaw) : undefined;
  if (monthRaw && (!Number.isInteger(month) || month < 1 || month > 12)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "invalid_month",
          message: `month 값이 올바르지 않습니다: ${monthRaw}`,
        },
      },
      { status: 400 }
    );
  }

  const kosisClient = getKOSISClient();
  if (!kosisClient.isConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "missing_kosis_api_key",
          message: "KOSIS_API_KEY 환경변수가 설정되지 않았습니다.",
        },
      },
      { status: 500 }
    );
  }

  const category = categoryRaw;

  const kosisResponse = month
    ? await kosisClient.fetchMonthlyData(category, regionCode, year, month)
    : await kosisClient.fetchStatistics(category, regionCode, year, year);

  if (!kosisResponse.success || !kosisResponse.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "kosis_error",
          message: kosisResponse.error ?? "KOSIS 데이터 조회에 실패했습니다.",
        },
      },
      { status: 502 }
    );
  }

  const regionName = getRegionName(regionCode);

  const data: DemographicDataItem[] = kosisResponse.data
    .map((item, idx) => {
      const parsed = KOSISClient.parseStatItem(item, category);
      if (!parsed) return null;

      const base: Omit<DemographicDataItem, "month"> = {
        id: `${category}-${regionCode}-${parsed.year}-${parsed.month ?? "00"}-${idx}`,
        category,
        regionCode,
        regionName,
        year: parsed.year,
        value: parsed.value,
        unit: parsed.unit,
      };

      if (parsed.month === null) {
        return base;
      }

      return {
        ...base,
        month: parsed.month,
      };
    })
    .filter((v): v is DemographicDataItem => v !== null);

  return NextResponse.json({ success: true, data: { data } });
}
