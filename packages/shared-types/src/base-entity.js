export class BaseEntity {
    constructor(props) {
        this.props = props;
    }
    touch() {
        if (this.props.updatedAt instanceof Date) {
            this.props.updatedAt = new Date();
        }
    }
    get propsAsJson() {
        return this.props;
    }
}
