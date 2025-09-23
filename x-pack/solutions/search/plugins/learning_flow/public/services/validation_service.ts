/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type {
  JourneyConfig,
  JourneyStep,
  ComponentConfig,
  LayoutTemplate,
  VariableSource,
} from '../../common/types';

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationError[];
}

export interface ValidationServiceSetup {
  validateJourney: (journey: JourneyConfig) => Promise<ValidationResult>;
  validateStep: (step: JourneyStep, journeyContext?: Partial<JourneyConfig>) => ValidationResult;
  validateComponent: (component: ComponentConfig) => ValidationResult;
  validateLayout: (layout: LayoutTemplate) => ValidationResult;
  validateVariables: (variables: Record<string, VariableSource>) => ValidationResult;
  registerCustomValidator: (
    type: 'journey' | 'step' | 'component' | 'layout' | 'variable',
    validator: CustomValidator
  ) => void;
}

export type CustomValidator = (
  item: any,
  context?: any
) => ValidationError[] | Promise<ValidationError[]>;

/**
 * Validation service for learning flow configurations
 * Follows the Home plugin's service pattern for extensibility
 */
export class ValidationService {
  private customValidators: Map<string, CustomValidator[]> = new Map([
    ['journey', []],
    ['step', []],
    ['component', []],
    ['layout', []],
    ['variable', []],
  ]);

  public setup(): ValidationServiceSetup {
    return {
      validateJourney: this.validateJourney.bind(this),
      validateStep: this.validateStep.bind(this),
      validateComponent: this.validateComponent.bind(this),
      validateLayout: this.validateLayout.bind(this),
      validateVariables: this.validateVariables.bind(this),
      registerCustomValidator: this.registerCustomValidator.bind(this),
    };
  }

  public registerCustomValidator(
    type: 'journey' | 'step' | 'component' | 'layout' | 'variable',
    validator: CustomValidator
  ) {
    const validators = this.customValidators.get(type) || [];
    validators.push(validator);
    this.customValidators.set(type, validators);
  }

  public async validateJourney(journey: JourneyConfig): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationError[] = [];

    // Validate journey metadata
    const metadataErrors = this.validateJourneyMetadata(journey);
    errors.push(...metadataErrors.filter((e) => e.severity === 'error'));
    warnings.push(...metadataErrors.filter((e) => e.severity === 'warning'));
    suggestions.push(...metadataErrors.filter((e) => e.severity === 'info'));

    // Validate global variables
    if (journey.variables) {
      const variableValidation = this.validateVariables(journey.variables);
      errors.push(...variableValidation.errors);
      warnings.push(...variableValidation.warnings);
      suggestions.push(...variableValidation.suggestions);
    }

    // Validate each step
    for (let i = 0; i < journey.steps.length; i++) {
      const step = journey.steps[i];
      const stepValidation = this.validateStep(step, journey);

      // Add step index to error paths
      const prefixPath = (error: ValidationError) => ({
        ...error,
        path: `steps[${i}].${error.path}`.replace(/^steps\[\d+\]\.\./, `steps[${i}].`),
      });

      errors.push(...stepValidation.errors.map(prefixPath));
      warnings.push(...stepValidation.warnings.map(prefixPath));
      suggestions.push(...stepValidation.suggestions.map(prefixPath));
    }

    // Validate step dependencies and flow
    const flowErrors = this.validateJourneyFlow(journey);
    errors.push(...flowErrors.filter((e) => e.severity === 'error'));
    warnings.push(...flowErrors.filter((e) => e.severity === 'warning'));

    // Run custom journey validators
    const customValidators = this.customValidators.get('journey') || [];
    for (const validator of customValidators) {
      try {
        const customErrors = await validator(journey);
        errors.push(...customErrors.filter((e) => e.severity === 'error'));
        warnings.push(...customErrors.filter((e) => e.severity === 'warning'));
        suggestions.push(...customErrors.filter((e) => e.severity === 'info'));
      } catch (error) {
        errors.push({
          code: 'CUSTOM_VALIDATOR_ERROR',
          message: `Custom validator failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
          path: 'journey',
          severity: 'error',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  public validateStep(
    step: JourneyStep,
    journeyContext?: Partial<JourneyConfig>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationError[] = [];

    // Required fields validation
    if (!step.id) {
      errors.push({
        code: 'MISSING_STEP_ID',
        message: i18n.translate('xpack.learningFlow.validation.step.missingId', {
          defaultMessage: 'Step ID is required',
        }),
        path: 'id',
        severity: 'error',
      });
    }

    if (!step.title || step.title.trim() === '') {
      errors.push({
        code: 'MISSING_STEP_TITLE',
        message: i18n.translate('xpack.learningFlow.validation.step.missingTitle', {
          defaultMessage: 'Step title is required',
        }),
        path: 'title',
        severity: 'error',
      });
    }

    // Validate layout
    const layoutValidation = this.validateLayout(step.layout);
    const prefixLayoutPath = (error: ValidationError) => ({
      ...error,
      path: `layout.${error.path}`,
    });
    errors.push(...layoutValidation.errors.map(prefixLayoutPath));
    warnings.push(...layoutValidation.warnings.map(prefixLayoutPath));
    suggestions.push(...layoutValidation.suggestions.map(prefixLayoutPath));

    // Validate components
    for (let i = 0; i < step.components.length; i++) {
      const component = step.components[i];
      const componentValidation = this.validateComponent(component);

      const prefixComponentPath = (error: ValidationError) => ({
        ...error,
        path: `components[${i}].${error.path}`,
      });

      errors.push(...componentValidation.errors.map(prefixComponentPath));
      warnings.push(...componentValidation.warnings.map(prefixComponentPath));
      suggestions.push(...componentValidation.suggestions.map(prefixComponentPath));
    }

    // Validate component-slot relationships
    const slotErrors = this.validateComponentSlots(step.components, step.layout);
    errors.push(...slotErrors);

    // Validate step variables
    if (step.variables) {
      const variableValidation = this.validateVariables(step.variables);
      const prefixVariablePath = (error: ValidationError) => ({
        ...error,
        path: `variables.${error.path}`,
      });
      errors.push(...variableValidation.errors.map(prefixVariablePath));
      warnings.push(...variableValidation.warnings.map(prefixVariablePath));
      suggestions.push(...variableValidation.suggestions.map(prefixVariablePath));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  public validateComponent(component: ComponentConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationError[] = [];

    // Required fields
    if (!component.id) {
      errors.push({
        code: 'MISSING_COMPONENT_ID',
        message: i18n.translate('xpack.learningFlow.validation.component.missingId', {
          defaultMessage: 'Component ID is required',
        }),
        path: 'id',
        severity: 'error',
      });
    }

    if (!component.type) {
      errors.push({
        code: 'MISSING_COMPONENT_TYPE',
        message: i18n.translate('xpack.learningFlow.validation.component.missingType', {
          defaultMessage: 'Component type is required',
        }),
        path: 'type',
        severity: 'error',
      });
    }

    // Validate props based on component type
    const propsValidation = this.validateComponentProps(component.type, component.props);
    errors.push(...propsValidation.filter((e) => e.severity === 'error'));
    warnings.push(...propsValidation.filter((e) => e.severity === 'warning'));
    suggestions.push(...propsValidation.filter((e) => e.severity === 'info'));

    // Validate conditions if present
    if (component.conditions) {
      const conditionErrors = this.validateConditions(component.conditions);
      errors.push(...conditionErrors.filter((e) => e.severity === 'error'));
      warnings.push(...conditionErrors.filter((e) => e.severity === 'warning'));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  public validateLayout(layout: LayoutTemplate): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationError[] = [];

    if (!layout.type) {
      errors.push({
        code: 'MISSING_LAYOUT_TYPE',
        message: i18n.translate('xpack.learningFlow.validation.layout.missingType', {
          defaultMessage: 'Layout type is required',
        }),
        path: 'type',
        severity: 'error',
      });
    } else {
      // Validate known layout types
      const validTypes = ['single-column', 'two-column', 'hero', 'side-by-side'];
      if (!validTypes.includes(layout.type)) {
        errors.push({
          code: 'INVALID_LAYOUT_TYPE',
          message: i18n.translate('xpack.learningFlow.validation.layout.invalidType', {
            defaultMessage: 'Invalid layout type: {type}. Valid types are: {validTypes}',
            values: {
              type: layout.type,
              validTypes: validTypes.join(', '),
            },
          }),
          path: 'type',
          severity: 'error',
          suggestion: i18n.translate('xpack.learningFlow.validation.layout.typeSuggestion', {
            defaultMessage: 'Use one of the supported layout types',
          }),
        });
      }
    }

    if (!layout.slots || layout.slots.length === 0) {
      warnings.push({
        code: 'EMPTY_LAYOUT_SLOTS',
        message: i18n.translate('xpack.learningFlow.validation.layout.emptySlots', {
          defaultMessage: 'Layout has no slots defined',
        }),
        path: 'slots',
        severity: 'warning',
        suggestion: i18n.translate('xpack.learningFlow.validation.layout.slotsSuggestion', {
          defaultMessage: 'Add slot names to define where components will be placed',
        }),
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  public validateVariables(variables: Record<string, VariableSource>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationError[] = [];

    for (const [key, variable] of Object.entries(variables)) {
      if (!variable.type) {
        errors.push({
          code: 'MISSING_VARIABLE_TYPE',
          message: i18n.translate('xpack.learningFlow.validation.variable.missingType', {
            defaultMessage: 'Variable {key} is missing type',
            values: { key },
          }),
          path: key,
          severity: 'error',
        });
      } else {
        const validTypes = ['static', 'user-input', 'computed', 'api'];
        if (!validTypes.includes(variable.type)) {
          errors.push({
            code: 'INVALID_VARIABLE_TYPE',
            message: i18n.translate('xpack.learningFlow.validation.variable.invalidType', {
              defaultMessage: 'Variable {key} has invalid type: {type}',
              values: { key, type: variable.type },
            }),
            path: key,
            severity: 'error',
          });
        }
      }

      // Type-specific validation
      if (variable.type === 'static' && variable.value === undefined) {
        warnings.push({
          code: 'STATIC_VARIABLE_NO_VALUE',
          message: i18n.translate('xpack.learningFlow.validation.variable.staticNoValue', {
            defaultMessage: 'Static variable {key} has no value defined',
            values: { key },
          }),
          path: key,
          severity: 'warning',
        });
      }

      if (variable.type === 'api' && !variable.key) {
        errors.push({
          code: 'API_VARIABLE_NO_KEY',
          message: i18n.translate('xpack.learningFlow.validation.variable.apiNoKey', {
            defaultMessage: 'API variable {key} requires a key property',
            values: { key },
          }),
          path: key,
          severity: 'error',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  private validateJourneyMetadata(journey: JourneyConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!journey.metadata.id) {
      errors.push({
        code: 'MISSING_JOURNEY_ID',
        message: i18n.translate('xpack.learningFlow.validation.journey.missingId', {
          defaultMessage: 'Journey ID is required',
        }),
        path: 'metadata.id',
        severity: 'error',
      });
    }

    if (!journey.metadata.title) {
      errors.push({
        code: 'MISSING_JOURNEY_TITLE',
        message: i18n.translate('xpack.learningFlow.validation.journey.missingTitle', {
          defaultMessage: 'Journey title is required',
        }),
        path: 'metadata.title',
        severity: 'error',
      });
    }

    if (!journey.metadata.description) {
      errors.push({
        code: 'MISSING_JOURNEY_DESCRIPTION',
        message: i18n.translate('xpack.learningFlow.validation.journey.missingDescription', {
          defaultMessage: 'Journey description is recommended',
        }),
        path: 'metadata.description',
        severity: 'warning',
      });
    }

    if (journey.metadata.estimatedTimeMinutes <= 0) {
      errors.push({
        code: 'INVALID_ESTIMATED_TIME',
        message: i18n.translate('xpack.learningFlow.validation.journey.invalidTime', {
          defaultMessage: 'Estimated time must be greater than 0',
        }),
        path: 'metadata.estimatedTimeMinutes',
        severity: 'warning',
      });
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(journey.metadata.difficulty)) {
      errors.push({
        code: 'INVALID_DIFFICULTY',
        message: i18n.translate('xpack.learningFlow.validation.journey.invalidDifficulty', {
          defaultMessage: 'Invalid difficulty level: {difficulty}',
          values: { difficulty: journey.metadata.difficulty },
        }),
        path: 'metadata.difficulty',
        severity: 'error',
      });
    }

    return errors;
  }

  private validateJourneyFlow(journey: JourneyConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    if (journey.steps.length === 0) {
      errors.push({
        code: 'EMPTY_JOURNEY',
        message: i18n.translate('xpack.learningFlow.validation.journey.emptySteps', {
          defaultMessage: 'Journey must have at least one step',
        }),
        path: 'steps',
        severity: 'error',
      });
    }

    // Check for duplicate step IDs
    const stepIds = journey.steps.map((step) => step.id);
    const duplicateIds = stepIds.filter((id, index) => stepIds.indexOf(id) !== index);
    for (const duplicateId of [...new Set(duplicateIds)]) {
      errors.push({
        code: 'DUPLICATE_STEP_ID',
        message: i18n.translate('xpack.learningFlow.validation.journey.duplicateStepId', {
          defaultMessage: 'Duplicate step ID found: {stepId}',
          values: { stepId: duplicateId },
        }),
        path: 'steps',
        severity: 'error',
      });
    }

    return errors;
  }

  private validateComponentSlots(
    components: ComponentConfig[],
    layout: LayoutTemplate
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const layoutSlots = layout.slots || [];

    for (const component of components) {
      if (component.slot && !(layoutSlots as string[]).includes(component.slot)) {
        errors.push({
          code: 'INVALID_COMPONENT_SLOT',
          message: i18n.translate('xpack.learningFlow.validation.component.invalidSlot', {
            defaultMessage: 'Component {componentId} references unknown slot: {slot}',
            values: {
              componentId: component.id,
              slot: component.slot,
            },
          }),
          path: `components.${component.id}.slot`,
          severity: 'error',
          suggestion: i18n.translate('xpack.learningFlow.validation.component.slotSuggestion', {
            defaultMessage: 'Available slots: {slots}',
            values: { slots: layoutSlots.join(', ') },
          }),
        });
      }
    }

    return errors;
  }

  private validateComponentProps(
    componentType: string,
    props: Record<string, any>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Component-specific prop validation
    switch (componentType) {
      case 'title':
        if (!props.text && !props.content) {
          errors.push({
            code: 'MISSING_TITLE_TEXT',
            message: i18n.translate('xpack.learningFlow.validation.component.title.missingText', {
              defaultMessage: 'Title component requires text or content property',
            }),
            path: 'props',
            severity: 'error',
          });
        }
        break;

      case 'text':
        if (!props.content && !props.markdown) {
          errors.push({
            code: 'MISSING_TEXT_CONTENT',
            message: i18n.translate('xpack.learningFlow.validation.component.text.missingContent', {
              defaultMessage: 'Text component requires content or markdown property',
            }),
            path: 'props',
            severity: 'error',
          });
        }
        break;

      case 'search-bar':
        if (props.placeholder && typeof props.placeholder !== 'string') {
          errors.push({
            code: 'INVALID_SEARCH_PLACEHOLDER',
            message: i18n.translate(
              'xpack.learningFlow.validation.component.search.invalidPlaceholder',
              {
                defaultMessage: 'Search bar placeholder must be a string',
              }
            ),
            path: 'props.placeholder',
            severity: 'error',
          });
        }
        break;

      case 'data-table':
        if (props.columns && !Array.isArray(props.columns)) {
          errors.push({
            code: 'INVALID_TABLE_COLUMNS',
            message: i18n.translate(
              'xpack.learningFlow.validation.component.table.invalidColumns',
              {
                defaultMessage: 'Data table columns must be an array',
              }
            ),
            path: 'props.columns',
            severity: 'error',
          });
        }
        break;

      case 'code':
        if (!props.code && !props.content) {
          errors.push({
            code: 'MISSING_CODE_CONTENT',
            message: i18n.translate('xpack.learningFlow.validation.component.code.missingContent', {
              defaultMessage: 'Code component requires code or content property',
            }),
            path: 'props',
            severity: 'error',
          });
        }
        break;

      case 'chart':
        if (!props.data && !props.config) {
          errors.push({
            code: 'MISSING_CHART_CONFIG',
            message: i18n.translate('xpack.learningFlow.validation.component.chart.missingConfig', {
              defaultMessage: 'Chart component requires data or config property',
            }),
            path: 'props',
            severity: 'warning',
          });
        }
        break;
    }

    return errors;
  }

  private validateConditions(
    conditions: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'exists';
      value: any;
    }>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];

      if (!condition.field) {
        errors.push({
          code: 'MISSING_CONDITION_FIELD',
          message: i18n.translate('xpack.learningFlow.validation.condition.missingField', {
            defaultMessage: 'Condition {index} is missing field property',
            values: { index: i },
          }),
          path: `conditions[${i}].field`,
          severity: 'error',
        });
      }

      const validOperators = ['equals', 'not_equals', 'contains', 'exists'];
      if (!validOperators.includes(condition.operator)) {
        errors.push({
          code: 'INVALID_CONDITION_OPERATOR',
          message: i18n.translate('xpack.learningFlow.validation.condition.invalidOperator', {
            defaultMessage: 'Condition {index} has invalid operator: {operator}',
            values: { index: i, operator: condition.operator },
          }),
          path: `conditions[${i}].operator`,
          severity: 'error',
        });
      }

      if (condition.operator !== 'exists' && condition.value === undefined) {
        errors.push({
          code: 'MISSING_CONDITION_VALUE',
          message: i18n.translate('xpack.learningFlow.validation.condition.missingValue', {
            defaultMessage: 'Condition {index} requires a value for operator {operator}',
            values: { index: i, operator: condition.operator },
          }),
          path: `conditions[${i}].value`,
          severity: 'error',
        });
      }
    }

    return errors;
  }
}
