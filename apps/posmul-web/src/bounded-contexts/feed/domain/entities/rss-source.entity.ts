import { Entity, UniqueEntityId } from "../common/entity";

interface RssSourceProps {
    title: string;
    url: string;
    category: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class RssSource extends Entity<RssSourceProps> {
    get title(): string {
        return this.props.title;
    }

    get url(): string {
        return this.props.url;
    }

    get category(): string {
        return this.props.category;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    private constructor(props: RssSourceProps, id?: UniqueEntityId) {
        super(props, id);
    }

    public static create(
        props: {
            title: string;
            url: string;
            category: string;
            isActive?: boolean;
            createdAt?: Date;
            updatedAt?: Date;
        },
        id?: UniqueEntityId
    ): RssSource {
        const defaultProps: RssSourceProps = {
            ...props,
            isActive: props.isActive ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        };

        return new RssSource(defaultProps, id);
    }

    public deactivate(): void {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }

    public activate(): void {
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }
}
