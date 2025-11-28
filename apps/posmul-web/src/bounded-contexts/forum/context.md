# Forum Bounded Context

## 도메인 개요

Forum 도메인은 posmul 플랫폼의 커뮤니티 기반 의사소통 및 정보 공유를 담당하는 핵심 바운디드 컨텍스트입니다. 이 도메인은 사용자들이 다양한 주제에 대해 소통하고, 정보를 공유하며, 토론하고, 아이디어를 제안하는 플랫폼을 제공합니다.

## 유비쿼터스 언어 (Ubiquitous Language)

### 핵심 개념

- **Forum**: 전체 커뮤니티 포럼 시스템
- **Post**: 포럼 내 게시물 (뉴스, 토론 주제, 아이디어, 예산 분석 등)
- **Comment**: 게시물에 대한 댓글
- **Category**: 포럼 분류 체계 (Cosmos, Colony, Nation, Region, Local)
- **Section**: 포럼 섹션 (News, Debate, Brainstorming, Budget)
- **Thread**: 특정 주제에 대한 연속된 토론
- **Participant**: 포럼 참여자 (작성자, 댓글러, 독자)
- **Moderator**: 포럼 운영자/조정자
- **Vote**: 투표 (찬성/반대, 별점 등)
- **Reputation**: 사용자 평판도
- **Activity**: 포럼 활동 (게시물 작성, 댓글, 투표 등)

### Forum Sections

1. **News (네트워크 뉴스)**
   - **NewsPost**: 뉴스 게시물
   - **NewsSource**: 뉴스 출처
   - **NewsCategory**: 뉴스 카테고리 (정치, 경제, 사회, 스포츠 등)

2. **Debate (토론/토의)**
   - **DebatePost**: 토론 주제
   - **Position**: 토론 입장 (찬성/반대/중립)
   - **Argument**: 논리적 근거
   - **DebateSession**: 토론 세션

3. **Brainstorming (아이디어 제안)**
   - **IdeaPost**: 아이디어 게시물
   - **Innovation**: 혁신 아이디어
   - **Collaboration**: 협업 제안
   - **Implementation**: 구현 계획

4. **Budget (예산 관리)**
   - **BudgetPost**: 예산 관련 게시물
   - **FinancialData**: 재무 데이터
   - **BudgetAnalysis**: 예산 분석
   - **BudgetCategory**: 예산 분류 (BS, IS, EF, CF, FN)

### 카테고리 체계

- **Cosmos**: 우주/글로벌 차원
- **Colony**: 식민지/대륙 차원
- **Nation**: 국가 차원
- **Region**: 지역 차원
- **Local**: 지역/커뮤니티 차원

## 핵심 비즈니스 규칙

### 1. 게시물 관리 규칙

- 모든 게시물은 반드시 하나의 Section과 Category에 속해야 함
- 게시물은 작성자만 수정/삭제 가능 (또는 모더레이터)
- 삭제된 게시물은 즉시 삭제되지 않고 일정 기간 보관
- 게시물 제목은 5자 이상 100자 이하
- 게시물 내용은 10자 이상 10,000자 이하

### 2. 댓글 시스템 규칙

- 댓글은 3단계까지 중첩 가능 (댓글 > 대댓글 > 대대댓글)
- 댓글 작성자만 수정/삭제 가능
- 댓글 내용은 1자 이상 1,000자 이하

### 3. 투표 시스템 규칙

- 사용자는 게시물/댓글당 1회만 투표 가능
- 투표는 변경 가능하지만 취소는 불가
- 투표 결과는 실시간 반영

### 4. 포인트 적립 규칙 (PMP)

- 게시물 작성: 10 PMP
- 댓글 작성: 5 PMP
- 투표 참여: 1 PMP
- 우수 게시물 선정: 50 PMP
- 토론 참여: 20 PMP
- 아이디어 채택: 100 PMP

### 5. 평판 시스템 규칙

- 초기 평판도: 100점
- 좋은 게시물/댓글 작성시 평판도 증가
- 신고당한 경우 평판도 감소
- 평판도에 따른 권한 차등 적용

### 6. 모더레이션 규칙

- 신고 접수시 자동 검토 대상 등록
- 일정 신고 수 이상시 임시 숨김 처리
- 모더레이터가 최종 판단
- 반복 위반자는 계정 제재

## 도메인 모델

### Aggregates

1. **Post Aggregate**
   - **Root**: Post
   - **Entities**: Comment, Vote, Attachment
   - **Value Objects**: PostId, Title, Content, PostStatus

2. **Thread Aggregate**
   - **Root**: Thread
   - **Entities**: ThreadParticipant
   - **Value Objects**: ThreadId, ThreadStatus

3. **User Activity Aggregate**
   - **Root**: UserActivity
   - **Entities**: ActivityLog
   - **Value Objects**: ActivityId, ActivityType, Points

### Value Objects

- `PostId`: 게시물 고유 식별자
- `CommentId`: 댓글 고유 식별자
- `ThreadId`: 스레드 고유 식별자
- `ForumSection`: 포럼 섹션 (NEWS, DEBATE, BRAINSTORMING, BUDGET)
- `ForumCategory`: 포럼 카테고리 (COSMOS, COLONY, NATION, REGION, LOCAL)
- `PostStatus`: 게시물 상태 (DRAFT, PUBLISHED, HIDDEN, DELETED)
- `VoteType`: 투표 타입 (UPVOTE, DOWNVOTE, RATING)
- `UserReputation`: 사용자 평판도
- `ActivityPoints`: 활동 포인트

### Domain Services

- **PostModerationService**: 게시물 검토 및 승인
- **ReputationCalculationService**: 평판도 계산
- **PointsCalculationService**: 포인트 계산 및 적립
- **RecommendationService**: 개인화 추천
- **ThreadManagementService**: 스레드 관리

### Repository Interfaces

- `IPostRepository`: 게시물 저장소
- `ICommentRepository`: 댓글 저장소
- `IThreadRepository`: 스레드 저장소
- `IUserActivityRepository`: 사용자 활동 저장소
- `IVoteRepository`: 투표 저장소

## 외부 바운디드 컨텍스트와의 관계

### User/Auth Context

- **Integration**: 사용자 인증 및 권한 확인
- **Events**: UserRegistered, UserUpdated
- **Anti-Corruption Layer**: UserService

### Payment Context

- **Integration**: PMP 포인트 적립
- **Events**: PointsEarned
- **Anti-Corruption Layer**: PointsService

### Notification Context

- **Integration**: 알림 발송
- **Events**: PostCreated, CommentCreated, VoteReceived
- **Anti-Corruption Layer**: NotificationService

## 도메인 이벤트

### Post Events

- `PostCreated`: 게시물 생성
- `PostUpdated`: 게시물 수정
- `PostDeleted`: 게시물 삭제
- `PostModerated`: 게시물 검토 완료

### Comment Events

- `CommentCreated`: 댓글 생성
- `CommentUpdated`: 댓글 수정
- `CommentDeleted`: 댓글 삭제

### Vote Events

- `VoteCast`: 투표 참여
- `VoteChanged`: 투표 변경

### Activity Events

- `ActivityRecorded`: 활동 기록
- `PointsEarned`: 포인트 적립
- `ReputationChanged`: 평판도 변경

## 기술적 고려사항

### 성능 요구사항

- 게시물 목록 조회: 500ms 이내
- 댓글 로딩: 200ms 이내
- 실시간 투표 결과 반영: 100ms 이내
- 동시 사용자: 10,000명 지원

### 확장성 고려사항

- 게시물 아카이빙 전략
- 댓글 페이지네이션
- 검색 인덱싱
- 캐싱 전략

### 보안 요구사항

- XSS 방지
- 스팸 방지
- 개인정보 보호
- 악성 콘텐츠 필터링

## 운영 정책

### 콘텐츠 정책

- 건전한 토론 문화 조성
- 혐오 발언 금지
- 허위 정보 유포 금지
- 상업적 광고 제한

### 모더레이션 정책

- 24시간 모니터링
- 자동 필터링 시스템
- 사용자 신고 시스템
- 공정한 제재 절차

### 데이터 보관 정책

- 삭제된 게시물 30일 보관
- 사용자 활동 로그 1년 보관
- 백업 및 복구 절차
- GDPR 준수
