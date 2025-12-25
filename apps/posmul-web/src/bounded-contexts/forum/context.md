# Forum Bounded Context

## 도메인 개요

Forum Context는 사용자들이 사회적 이슈에 대해 토론하고 정보를 공유하는 공간입니다. 포럼 활동을 통해 집단지성을 형성하고, 이는 예측 시장의 정보로 활용됩니다.

## 핵심 엔티티

- **Post**: 게시글 (제목, 내용, 작성자)
- **Comment**: 댓글
- **Vote**: 투표 (찬성/반대)

## 주요 서비스

- **RewardForumActivity**: 포럼 활동(작성, 댓글 등)에 대한 PMP 보상 지급
- **CreatePredictionFromForum**: 포럼 논의를 바탕으로 예측 게임 생성 (연계 기능)
- **ForumActivityLog**: 활동 로그 기록

## 외부 의존성

- **Auth Context**: 작성자 인증
- **Economy Context**: 활동 보상(PMP) 지급
- **Prediction Context**: 예측 게임 생성 연동
