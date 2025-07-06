/**
 * Economy Kernel Types
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
// Economy Kernel Error
export class EconomyKernelError extends Error {
    constructor(message, code, cause) {
        super(message);
        this.code = code;
        this.cause = cause;
        this.name = "EconomyKernelError";
    }
}
// Economic Error
export class EconomicError extends Error {
    constructor(message, economicType) {
        super(message);
        this.economicType = economicType;
        this.name = "EconomicError";
    }
}
