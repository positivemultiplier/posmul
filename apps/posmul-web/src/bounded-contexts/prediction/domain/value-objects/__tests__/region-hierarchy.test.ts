import { resolveNormalizedRegion } from "../region-hierarchy";

describe("resolveNormalizedRegion (4단계 공간 계층 태깅)", () => {
  it("명시적 regionLevel과 regionCode가 주어지면 해당 프리셋 정보를 정규화해 반환한다", () => {
    const result = resolveNormalizedRegion({
      regionLevel: "local",
      regionCode: "29200",
    });

    expect(result).toEqual({
      regionLevel: "LOCAL",
      regionCode: "29200",
      regionName: "광주 광산구",
    });
  });

  it("제목에 구·군(예: 서울 성동구, 광주 광산구)이 언급되면 초기 주력 단계인 LOCAL로 자동 태깅한다", () => {
    const result = resolveNormalizedRegion({
      title: "[문화행사] 성동구 서울숲 주말 플리마켓 누적 방문객 5천명 돌파할까?",
    });

    expect(result.regionLevel).toBe("LOCAL");
    expect(result.regionCode).toBe("11200");
    expect(result.regionName).toBe("서울 성동구");
  });

  it("축구·야구·인구 등 '구'가 들어간 일반 명사에 대해서는 LOCAL 오탐을 하지 않는다", () => {
    const result = resolveNormalizedRegion({
      title: "[SPORTS] 한국 축구대표팀 이번 A매치 경기에서 승리할까?",
      summary: "국내외 축구 팬들의 관심 속에 인구가 많은 수도권 경기장에서 열립니다.",
    });

    expect(result).toEqual({
      regionLevel: "NATION",
      regionCode: "KR",
      regionName: "대한민국",
    });
  });

  it("시·도 광역 단위가 명시되면 REGION으로 자동 태깅한다", () => {
    const result = resolveNormalizedRegion({
      title: "[우리시 맑은하늘] 광주광역시 이번 주 초미세먼지 좋음 유지할까?",
    });

    expect(result).toEqual({
      regionLevel: "REGION",
      regionCode: "29000",
      regionName: "광주광역시",
    });
  });

  it("DONG은 명시적 태그나 시범 거점 동네 제목에만 제한적으로 매핑한다", () => {
    const result = resolveNormalizedRegion({
      title: "[우리동네] 첨단2동 주민센터 주말 문화축제 목표 참여 달성할까?",
    });

    expect(result).toEqual({
      regionLevel: "DONG",
      regionCode: "29200635",
      regionName: "첨단2동",
    });
  });
});
