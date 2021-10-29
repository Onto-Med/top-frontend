export interface IEntity {
  id?: string;
  title: string;
  entityType: EntityType;
  titles: Record<string, string>[];
  dataType?: DataType;
  synonyms: Record<string, string>[];
  descriptions: Record<string, string>[];
  codes?: ICode[];
  score?: number;
  units?: string[];
  negated?: boolean;
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