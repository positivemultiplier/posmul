// Authentication Domain Types for PosMul
// Domain-Driven Design + Clean Architecture
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { createUserId, createEmail } from './branded-types';
import { DomainError } from './errors';
export { createUserId, createEmail };
// === Domain Errors ===
var AuthUserNotFoundError = /** @class */ (function (_super) {
    __extends(AuthUserNotFoundError, _super);
    function AuthUserNotFoundError(identifier) {
        return _super.call(this, "User not found: ".concat(identifier)) || this;
    }
    return AuthUserNotFoundError;
}(DomainError));
export { AuthUserNotFoundError };
var AuthUserAlreadyExistsError = /** @class */ (function (_super) {
    __extends(AuthUserAlreadyExistsError, _super);
    function AuthUserAlreadyExistsError(identifier) {
        return _super.call(this, "User already exists: ".concat(identifier)) || this;
    }
    return AuthUserAlreadyExistsError;
}(DomainError));
export { AuthUserAlreadyExistsError };
var AuthInvalidCredentialsError = /** @class */ (function (_super) {
    __extends(AuthInvalidCredentialsError, _super);
    function AuthInvalidCredentialsError() {
        return _super.call(this, 'Invalid email or password') || this;
    }
    return AuthInvalidCredentialsError;
}(DomainError));
export { AuthInvalidCredentialsError };
var EmailNotVerifiedError = /** @class */ (function (_super) {
    __extends(EmailNotVerifiedError, _super);
    function EmailNotVerifiedError() {
        return _super.call(this, 'Email address has not been verified') || this;
    }
    return EmailNotVerifiedError;
}(DomainError));
export { EmailNotVerifiedError };
var InsufficientBalanceError = /** @class */ (function (_super) {
    __extends(InsufficientBalanceError, _super);
    function InsufficientBalanceError(requested, available, currency) {
        return _super.call(this, "Insufficient ".concat(currency, " balance. Requested: ").concat(requested, ", Available: ").concat(available)) || this;
    }
    return InsufficientBalanceError;
}(DomainError));
export { InsufficientBalanceError };
var UsernameInvalidError = /** @class */ (function (_super) {
    __extends(UsernameInvalidError, _super);
    function UsernameInvalidError(username) {
        return _super.call(this, "Username \"".concat(username, "\" is invalid. Must be 3-50 characters, alphanumeric and underscores only")) || this;
    }
    return UsernameInvalidError;
}(DomainError));
export { UsernameInvalidError };
var EmailInvalidError = /** @class */ (function (_super) {
    __extends(EmailInvalidError, _super);
    function EmailInvalidError(email) {
        return _super.call(this, "Email \"".concat(email, "\" is invalid")) || this;
    }
    return EmailInvalidError;
}(DomainError));
export { EmailInvalidError };
// === Factory Functions ===
export var createUsername = function (username) { return username; };
// === Validation Utilities ===
export var isValidEmail = function (email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export var isValidUsername = function (username) {
    var usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.test(username);
};
export var isValidPassword = function (password) {
    return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password);
};
//# sourceMappingURL=auth-domain.js.map