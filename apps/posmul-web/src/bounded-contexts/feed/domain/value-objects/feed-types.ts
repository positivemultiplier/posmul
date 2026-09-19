export enum ContentClassification {
    PREDICTION = "PREDICTION",
    FORUM = "FORUM",
    UNCLASSIFIED = "UNCLASSIFIED",
    DISCARD = "DISCARD"
}

export enum ProcessStatus {
    PENDING = "PENDING",
    CLASSIFIED = "CLASSIFIED", // AI 분류 완료 상태 (Draft 생성 대기)
    DRAFT_CREATED = "DRAFT_CREATED",
    PUBLISHED = "PUBLISHED",
    IGNORED = "IGNORED",
    ERROR = "ERROR"
}

export enum BillProcessResult {
    PASSED = "원안가결",
    MODIFIED_PASSED = "수정가결",
    REJECTED = "부결",
    DISCARDED = "폐기",
    WITHDRAWN = "철회"
}
