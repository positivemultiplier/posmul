import {
  extractSportsMatchupBadges,
  findSportsTeamPalette,
} from "../sports-team-palettes";

describe("sports-team-palettes", () => {
  it("EPL·KBO·LCK vs 매치업에서 두 팀의 고유 컬러와 티커를 추출한다", () => {
    const epl = extractSportsMatchupBadges({
      title: "2026 북런던 더비: 토트넘 vs 아스날, 최종 경기 결과는?",
      category: "SPORTS",
      subcategory: "soccer",
    });
    expect(epl?.mode).toBe("matchup");
    expect(epl?.home.code).toBe("TOT");
    expect(epl?.away?.code).toBe("ARS");

    const kbo = extractSportsMatchupBadges({
      title: "[KBO] KIA 타이거즈 vs 삼성 라이온즈 주말 3연전 승자는?",
      category: "SPORTS",
      subcategory: "baseball",
    });
    expect(kbo?.mode).toBe("matchup");
    expect(kbo?.home.code).toBe("KIA");
    expect(kbo?.away?.code).toBe("SAM");

    const lck = extractSportsMatchupBadges({
      title: "[LCK] T1 vs 젠지 결승전 승리 팀은?",
      category: "SPORTS",
      subcategory: "esports",
    });
    expect(lck?.mode).toBe("matchup");
    expect(lck?.home.code).toBe("T1");
    expect(lck?.away?.code).toBe("GEN");
  });

  it("단일 팀/대표팀 스포츠 의제에서 단일 방패 배지를 반환한다", () => {
    const kor = extractSportsMatchupBadges({
      title: "[SPORTS] 로베르트 모레노 임시 감독은 한국 축구대표팀 지휘봉을 잡을까?",
      category: "SPORTS",
      subcategory: "soccer",
    });
    expect(kor?.mode).toBe("single");
    expect(kor?.home.code).toBe("KOR");
    expect(kor?.home.primaryHex).toBe("#CD2E3A");
  });

  it("미등록 팀 간 vs 대결에도 결정론적 폴백 팀 배지를 생성한다", () => {
    const custom = extractSportsMatchupBadges({
      title: "[ACLE] 교토 상가 vs 조호르 다룰 탁짐 경기 결과는?",
      category: "SPORTS",
      subcategory: "soccer",
    });
    expect(custom?.mode).toBe("matchup");
    expect(custom?.home.code.length).toBeGreaterThanOrEqual(2);
    expect(custom?.away?.code.length).toBeGreaterThanOrEqual(2);
  });

  it("경제·정치 등 비스포츠 의제에서는 null을 반환해 기존 심볼 아바타를 유지한다", () => {
    const economy = extractSportsMatchupBadges({
      title: "[실적공시] 삼성전자 이번 분기 연결 영업이익 10조 원 돌파할까?",
      category: "ECONOMY",
      subcategory: "earnings",
    });
    expect(economy).toBeNull();
  });

  it("광주FC와 전남드래곤즈 등 지역 구단 팔레트를 정확히 식별한다", () => {
    expect(findSportsTeamPalette("광주FC 홈경기")?.code).toBe("GWJ");
    expect(findSportsTeamPalette("전남드래곤즈 승격")?.code).toBe("JND");
  });
});
