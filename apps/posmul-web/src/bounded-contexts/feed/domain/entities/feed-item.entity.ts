import { Entity, UniqueEntityId } from "../common/entity";
import { ContentClassification, ProcessStatus } from "../value-objects/feed-types";

interface FeedItemProps {
    sourceId: string | null;
    title: string;
    link: string;
    contentSummary: string | null;
    publishedAt: Date | null;
    aiClassification: ContentClassification;
    processStatus: ProcessStatus;
    processedAt: Date | null;
    createdAt: Date;
}

export class FeedItem extends Entity<FeedItemProps> {
    get sourceId(): string | null {
        return this.props.sourceId;
    }

    get title(): string {
        return this.props.title;
    }

    get link(): string {
        return this.props.link;
    }

    get contentSummary(): string | null {
        return this.props.contentSummary;
    }

    get publishedAt(): Date | null {
        return this.props.publishedAt;
    }

    get aiClassification(): ContentClassification {
        return this.props.aiClassification;
    }

    get processStatus(): ProcessStatus {
        return this.props.processStatus;
    }

    get processedAt(): Date | null {
        return this.props.processedAt;
    }

    private constructor(props: FeedItemProps, id?: UniqueEntityId) {
        super(props, id);
    }

    public static create(
        props: {
            sourceId?: string | null;
            title: string;
            link: string;
            contentSummary?: string | null;
            publishedAt?: Date | null;
            aiClassification?: ContentClassification;
            processStatus?: ProcessStatus;
            processedAt?: Date | null;
            createdAt?: Date;
        },
        id?: UniqueEntityId
    ): FeedItem {
        const defaultProps: FeedItemProps = {
            sourceId: props.sourceId ?? null,
            title: props.title,
            link: props.link,
            contentSummary: props.contentSummary ?? null,
            publishedAt: props.publishedAt ?? null,
            aiClassification: props.aiClassification ?? ContentClassification.UNCLASSIFIED,
            processStatus: props.processStatus ?? ProcessStatus.PENDING,
            processedAt: props.processedAt ?? null,
            createdAt: props.createdAt ?? new Date(),
        };

        return new FeedItem(defaultProps, id);
    }

    // --- Domain Behaviors ---

    // AI 분류 결과 적용
    public classify(classification: ContentClassification) {
        this.props.aiClassification = classification;
        this.props.processStatus = ProcessStatus.CLASSIFIED;
        this.props.processedAt = new Date();
    }

    // Draft 생성 완료 처리 (Phase 2 후반부용)
    public markAsDrafted() {
        this.props.processStatus = ProcessStatus.DRAFT_CREATED;
    }

    // 비예측/중복/저품질 아이템 큐 제외 처리
    public markAsIgnored(classification: ContentClassification = ContentClassification.DISCARD) {
        this.props.aiClassification = classification;
        this.props.processStatus = ProcessStatus.IGNORED;
        this.props.processedAt = new Date();
    }
}
