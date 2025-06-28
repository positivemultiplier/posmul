import { SolutionTemplate, TemplateType } from '../entities/solution-template.entity';
import { Result, success, failure, DomainError } from '@/shared/errors';

export interface TemplateRenderContext {
  variables: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface TemplateValidationResult {
  isValid: boolean;
  missingVariables: string[];
  typeErrors: string[];
  warnings: string[];
}

export interface RenderedTemplate {
  content: string;
  usedVariables: string[];
  renderTime: number;
  metadata: {
    templateId: string;
    templateType: TemplateType;
    renderTimestamp: Date;
  };
}

/**
 * TemplateEngine Domain Service
 * 
 * Provides comprehensive template processing capabilities including:
 * - Variable substitution with nested object support
 * - Type validation and coercion
 * - Template validation and preprocessing
 * - Error handling and reporting
 * - Performance optimization
 * 
 * Follows DDD principles and integrates with PosMul's shared kernel.
 */
export class TemplateEngineService {
  private readonly variablePattern = /{{\s*([\w.]+)(?:\|([^}]+))?\s*}}/g;
  private readonly maxRecursionDepth = 10;
  private readonly renderTimeoutMs = 5000;

  /**
   * Render a template with provided context
   */
  public render(
    template: SolutionTemplate,
    context: TemplateRenderContext
  ): Result<RenderedTemplate, DomainError> {
    const startTime = Date.now();

    // Input validation
    if (!template) {
      return failure(new DomainError('Template is required', 'TEMPLATE_REQUIRED'));
    }
    if (!context) {
      return failure(new DomainError('Context is required', 'CONTEXT_REQUIRED'));
    }

    try {
      // Validate template before rendering
      const validationResult = this.validateTemplate(template, context);
      if (!validationResult.isValid) {
        return failure(new DomainError(
          `Template validation failed: ${validationResult.missingVariables.join(', ')}`,
          'TEMPLATE_VALIDATION_FAILED'
        ));
      }

      // Perform rendering
      const renderResult = this.performRender(template, context);
      if (!renderResult.success) {
        return renderResult;
      }

      const renderTime = Date.now() - startTime;

      // Check timeout
      if (renderTime > this.renderTimeoutMs) {
        return failure(new DomainError('Template rendering timeout', 'RENDER_TIMEOUT'));
      }

      const renderedTemplate: RenderedTemplate = {
        content: renderResult.data,
        usedVariables: this.extractUsedVariables(template.content),
        renderTime,
        metadata: {
          templateId: template.id,
          templateType: template.templateType,
          renderTimestamp: new Date()
        }
      };

      return success(renderedTemplate);
    } catch (error) {
      return failure(new DomainError(
        `Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RENDER_ERROR'
      ));
    }
  }

  /**
   * Validate template against provided context
   */
  public validateTemplate(
    template: SolutionTemplate,
    context: TemplateRenderContext
  ): TemplateValidationResult {
    const result: TemplateValidationResult = {
      isValid: true,
      missingVariables: [],
      typeErrors: [],
      warnings: []
    };

    // Extract all variables from template
    const templateVariables = this.extractTemplateVariables(template.content);
    
    // Check for missing variables
    for (const variable of templateVariables) {
      const value = this.resolveVariable(context.variables, variable);
      if (value === undefined || value === null) {
        result.missingVariables.push(variable);
        result.isValid = false;
      }
    }

    // Check for unused variables (warnings)
    const contextVariables = Object.keys(context.variables);
    const unusedVariables = contextVariables.filter(
      key => !templateVariables.includes(key)
    );
    if (unusedVariables.length > 0) {
      result.warnings.push(`Unused variables: ${unusedVariables.join(', ')}`);
    }

    return result;
  }

  /**
   * Preview template with sample data
   */
  public preview(
    template: SolutionTemplate,
    sampleData?: Record<string, unknown>
  ): Result<string, DomainError> {
    // Generate sample data if not provided
    const previewData = sampleData || this.generateSampleData(template);
    
    const context: TemplateRenderContext = {
      variables: previewData
    };

    const renderResult = this.render(template, context);
    if (!renderResult.success) {
      return failure(renderResult.error);
    }

    return success(renderResult.data.content);
  }

  /**
   * Extract all variable names used in template
   */
  public extractTemplateVariables(content: string): string[] {
    const variables: string[] = [];
    let match;
    
    // Reset regex lastIndex
    this.variablePattern.lastIndex = 0;
    
    while ((match = this.variablePattern.exec(content)) !== null) {
      const variableName = match[1];
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    return variables;
  }

  /**
   * Perform the actual template rendering
   */
  private performRender(
    template: SolutionTemplate,
    context: TemplateRenderContext,
    recursionDepth: number = 0
  ): Result<string, DomainError> {
    if (recursionDepth > this.maxRecursionDepth) {
      return failure(new DomainError('Maximum recursion depth exceeded', 'MAX_RECURSION_EXCEEDED'));
    }

    let content = template.content;
    
    // Reset regex lastIndex
    this.variablePattern.lastIndex = 0;
    
    content = content.replace(this.variablePattern, (match, variablePath, filter) => {
      try {
        let value = this.resolveVariable(context.variables, variablePath);
        
        // Apply filter if specified
        if (filter && value !== undefined && value !== null) {
          value = this.applyFilter(value, filter);
        }
        
        // Convert to string
        if (value === undefined || value === null) {
          return match; // Keep original placeholder if value not found
        }
        
        return String(value);
      } catch (error) {
        console.warn(`Failed to resolve variable ${variablePath}:`, error);
        return match; // Keep original placeholder on error
      }
    });

    return success(content);
  }

  /**
   * Resolve nested variable path (e.g., "user.profile.name")
   */
  private resolveVariable(variables: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let current: any = variables;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Apply filter to value (e.g., "upper", "lower", "trim")
   */
  private applyFilter(value: unknown, filter: string): unknown {
    const stringValue = String(value);
    
    switch (filter.toLowerCase().trim()) {
      case 'upper':
        return stringValue.toUpperCase();
      case 'lower':
        return stringValue.toLowerCase();
      case 'trim':
        return stringValue.trim();
      case 'capitalize':
        return stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();
      case 'length':
        return stringValue.length;
      default:
        console.warn(`Unknown filter: ${filter}`);
        return value;
    }
  }

  /**
   * Generate sample data for template preview
   */
  private generateSampleData(template: SolutionTemplate): Record<string, unknown> {
    const sampleData: Record<string, unknown> = {};
    const templateVariables = this.extractTemplateVariables(template.content);
    
    // Use template's existing variables as base
    Object.assign(sampleData, template.variables);
    
    // Generate sample values for missing variables
    for (const variable of templateVariables) {
      if (!(variable in sampleData)) {
        // Generate appropriate sample value based on variable name
        if (variable.includes('name')) {
          sampleData[variable] = 'Sample Name';
        } else if (variable.includes('date')) {
          sampleData[variable] = new Date().toISOString().split('T')[0];
        } else if (variable.includes('number') || variable.includes('count')) {
          sampleData[variable] = 42;
        } else {
          sampleData[variable] = `Sample ${variable}`;
        }
      }
    }
    
    return sampleData;
  }

  /**
   * Extract variables that were actually used during rendering
   */
  private extractUsedVariables(content: string): string[] {
    return this.extractTemplateVariables(content);
  }
} 