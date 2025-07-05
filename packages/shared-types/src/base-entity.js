var BaseEntity = /** @class */ (function () {
    function BaseEntity(props) {
        this.props = props;
    }
    BaseEntity.prototype.touch = function () {
        if (this.props.updatedAt instanceof Date) {
            this.props.updatedAt = new Date();
        }
    };
    Object.defineProperty(BaseEntity.prototype, "propsAsJson", {
        get: function () {
            return this.props;
        },
        enumerable: false,
        configurable: true
    });
    return BaseEntity;
}());
export { BaseEntity };
