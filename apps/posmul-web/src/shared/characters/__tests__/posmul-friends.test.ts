import {
  POSMUL_FRIENDS,
  POSMUL_STICKERS,
  encodeGuestbookStickerMessage,
  getFriendByDomain,
  getFriendFromMinimiStyle,
  parseGuestbookStickerMessage,
} from "../posmul-friends";

describe("posmul-friends", () => {
  it("7명의 포스멀 프렌즈와 각 4방향 뷰·4종 표정·28종 스티커가 유효하다", () => {
    expect(POSMUL_FRIENDS).toHaveLength(7);
    expect(POSMUL_STICKERS).toHaveLength(28);
    for (const friend of POSMUL_FRIENDS) {
      expect(friend.views.front).toContain(`/sprites/${friend.id}/front.png`);
      expect(friend.views.back).toContain(`/sprites/${friend.id}/back.png`);
      expect(friend.expressions).toHaveLength(4);
      expect(friend.domainTips.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("도메인 및 힐링룸 미니미 ID에 맞는 캐릭터를 매핑한다", () => {
    expect(getFriendByDomain("prediction").id).toBe("ollie");
    expect(getFriendByDomain("donation").id).toBe("ongi");
    expect(getFriendByDomain("consume").id).toBe("moa");
    expect(getFriendByDomain("forum").id).toBe("ago");
    expect(getFriendByDomain("ranking").id).toBe("beomi");
    expect(getFriendByDomain("economy").id).toBe("wavy");
    expect(getFriendByDomain("healing-room").id).toBe("roomie");

    expect(getFriendFromMinimiStyle("friend-ollie")?.id).toBe("ollie");
    expect(getFriendFromMinimiStyle("warm-knit")).toBeNull();
  });

  it("방명록 스티커 토큰 인코딩/파싱이 정확하며 200자 제한을 지킨다", () => {
    const onlySticker = encodeGuestbookStickerMessage("", "ollie-expr-2");
    expect(onlySticker).toBe("[[pm:ollie-expr-2]]");
    const parsedOnly = parseGuestbookStickerMessage(onlySticker);
    expect(parsedOnly.text).toBe("");
    expect(parsedOnly.sticker?.id).toBe("ollie-expr-2");

    const longText = "가".repeat(250);
    const combined = encodeGuestbookStickerMessage(longText, "roomie-expr-1");
    expect(combined.length).toBeLessThanOrEqual(200);
    const parsedCombined = parseGuestbookStickerMessage(combined);
    expect(parsedCombined.sticker?.friendId).toBe("roomie");
    expect(parsedCombined.text.length).toBeGreaterThan(100);
  });
});
