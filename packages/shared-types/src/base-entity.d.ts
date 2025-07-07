export declare abstract class BaseEntity<T extends {
    updatedAt?: Date;
}> {
    readonly props: T;
    protected constructor(props: T);
    protected touch(): void;
    get propsAsJson(): T;
}
//# sourceMappingURL=base-entity.d.ts.map