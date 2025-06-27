export abstract class BaseEntity<T extends { updatedAt?: Date }> {
    protected readonly props: T;

    protected constructor(props: T) {
        this.props = props;
    }

    protected touch(): void {
        if (this.props.updatedAt instanceof Date) {
            this.props.updatedAt = new Date();
        }
    }

    public get propsAsJson(): T {
        return this.props;
    }
} 