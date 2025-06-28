import { Result } from "@/shared/errors";
import { RepositoryError } from "@/shared/errors/repository.error";
import { SolutionTemplate, SolutionTemplateId, TemplateType } from "../entities/solution-template.entity";

/**
 * SolutionTemplate Repository Interface
 * 
 * Defines the contract for SolutionTemplate persistence.
 * Follows Clean Architecture principles - domain defines interface,
 * infrastructure provides implementation.
 */
export interface ISolutionTemplateRepository {
  // Basic CRUD operations
  save(template: SolutionTemplate): Promise<Result<void, RepositoryError>>;
  findById(id: SolutionTemplateId): Promise<Result<SolutionTemplate | null, RepositoryError>>;
  findAll(): Promise<Result<SolutionTemplate[], RepositoryError>>;
  delete(id: SolutionTemplateId): Promise<Result<void, RepositoryError>>;

  // Query operations
  findByType(templateType: TemplateType): Promise<Result<SolutionTemplate[], RepositoryError>>;
  findActiveTemplates(): Promise<Result<SolutionTemplate[], RepositoryError>>;
  findByTitle(title: string): Promise<Result<SolutionTemplate[], RepositoryError>>;
  findByTitleContaining(searchTerm: string): Promise<Result<SolutionTemplate[], RepositoryError>>;

  // Analytics
  getTemplateUsageStats(templateId: SolutionTemplateId): Promise<Result<TemplateUsageStats, RepositoryError>>;
  getMostUsedTemplates(limit?: number): Promise<Result<SolutionTemplate[], RepositoryError>>;
}

export interface TemplateUsageStats {
  templateId: SolutionTemplateId;
  title: string;
  usageCount: number;
  lastUsedAt: Date | null;
  averageScore: number;
  questionsCreated: number;
} 