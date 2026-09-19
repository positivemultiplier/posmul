
export class UniqueEntityId {
    private value: string;

    constructor(id?: string) {
        this.value = id ? id : crypto.randomUUID();
    }

    toString(): string {
        return this.value;
    }

    toValue(): string {
        return this.value;
    }
}

export abstract class Entity<T> {
    protected readonly _id: UniqueEntityId;
    public readonly props: T;

    constructor(props: T, id?: UniqueEntityId) {
        this._id = id ? id : new UniqueEntityId();
        this.props = props;
    }

    get id(): UniqueEntityId {
        return this._id;
    }
}
