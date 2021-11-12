export interface IRestriction {
  type: DataType
  negated?: boolean
  quantor?: QuantorType
  minOperator?: RestrictionOperator
  maxOperator?: RestrictionOperator
  values: Array<string|number|boolean|Date>
}

export interface ICodeSystem {
  uri: string
  name: string
}
export interface ICode {
  codeSystem: ICodeSystem
  code: string
  name: string
}

export interface IExpression {
  type: ExpressionType
  id?: string|number
  operands?: IExpression[]
}

export interface IUserAccount {
  id: string
  name: string
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
  GreaterEqual = '≥',
  GreaterThan  = '>'
}

export enum QuantorType {
  None   = 'none',
  Exists = 'exists',
  Some   = 'some',
  All    = 'all'
}
