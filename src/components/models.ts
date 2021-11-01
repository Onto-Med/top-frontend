export interface IEntity {
  id?: string;
  entityType: EntityType;
  title?: string
  titles?: Record<string, string>[];
  synonyms?: Record<string, string>[];
  descriptions?: Record<string, string>[];
  dataType?: DataType;
  codes?: ICode[];
  score?: number;
  units?: string[];
  negated?: boolean;
  superClass?: IEntity;
  restriction?: IRestrictionComponent[];
}

export interface IRestrictionComponent {
  operator?: RestrictionOperator,
  value: string|number|boolean|Date
}

export interface IEntityTreeNode {
  id: string|number;
  label: string;
  icon?: string;
  children?: IEntityTreeNode[];
}

export interface ICodeSystem {
  uri: string;
  name: string;
}
export interface ICode {
  codeSystem: ICodeSystem;
  code: string;
  name: string;
}

export enum EntityType {
  Category            = 'category',
  MissingValue        = 'missing_value',
  PhenotypeGroup      = 'phenotype_group',
  SinglePhenotype     = 'single_phenotype',
  CombinedPhenotype   = 'combined_phenotype',
  DerivedPhenotype    = 'derived_phenotype',
  SingleRestriction   = 'single_restriction',
  CombinedRestriction = 'combined_restriction',
  DerivedRestriction  = 'derived_restriction'
}

export enum DataType {
  String   = 'string',
  Number   = 'number',
  Boolean  = 'boolean',
  DateTime = 'dateTime'
}

export enum ExpressionType {
  Class        = 'class',
  Restriction  = 'restriction',
  Union        = 'union',
  Intersection = 'intersection',
  Complement   = 'complement'
}

export enum RestrictionOperator {
  LowerThan    = '<',
  LowerEqual   = '≤',
  Equal        = '=',
  GreaterEqual = '≥',
  GreaterThan  = '>'
}
