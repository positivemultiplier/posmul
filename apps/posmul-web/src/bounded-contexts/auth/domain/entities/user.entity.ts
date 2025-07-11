import { UserId, Email, UserRoleObject } from '../value-objects/user-value-objects';

export interface UserProps {
  id: UserId;
  email: Email;
  displayName?: string;
  role: UserRoleObject;
  pmcBalance: number;
  pmpBalance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    return new User({
      ...props,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromDatabase(props: UserProps): User {
    return new User(props);
  }

  // Getters
  get id(): UserId {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get displayName(): string | undefined {
    return this.props.displayName;
  }

  get role(): UserRoleObject {
    return this.props.role;
  }

  get pmcBalance(): number {
    return this.props.pmcBalance;
  }

  get pmpBalance(): number {
    return this.props.pmpBalance;
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

  // Business Logic
  updateDisplayName(displayName: string): void {
    if (displayName.trim().length === 0) {
      throw new Error('Display name cannot be empty');
    }
    this.props.displayName = displayName;
    this.props.updatedAt = new Date();
  }

  addPmcPoints(amount: number): void {
    if (amount <= 0) {
      throw new Error('PmcAmount amount must be positive');
    }
    this.props.pmcBalance += amount;
    this.props.updatedAt = new Date();
  }

  deductPmcPoints(amount: number): void {
    if (amount <= 0) {
      throw new Error('PmcAmount amount must be positive');
    }
    if (this.props.pmcBalance < amount) {
      throw new Error('Insufficient PmcAmount balance');
    }
    this.props.pmcBalance -= amount;
    this.props.updatedAt = new Date();
  }

  addPmpPoints(amount: number): void {
    if (amount <= 0) {
      throw new Error('PmpAmount amount must be positive');
    }
    this.props.pmpBalance += amount;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  // Domain Events (나중에 구현)
  // getDomainEvents(): DomainEvent[] { ... }
  // clearDomainEvents(): void { ... }

  toJSON(): UserProps {
    return { ...this.props };
  }
}
