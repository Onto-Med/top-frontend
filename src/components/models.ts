export interface IPhenotype {
  id: string;
  title: string;
  entityType: EntityType;
  titles: Record<string, string>[];
  datatype: string;
  synonyms: Record<string, string>[];
  descriptions: Record<string, string>[];
}

export interface IPhenotypeTreeNode {
  id: string;
  label: string;
  icon: string;
  children: IPhenotypeTreeNode[];
}

export enum EntityType {
  Category                      = 'category',
  MissingValuePhenotype         = 'missing_value_phenotype',
  GroupPhenotype                = 'group_phenotype',
  UnrestrictedSinglePhenotype   = 'unrestricted_single_phenotype',
  UnrestrictedCombinedPhenotype = 'unrestricted_combined_phenotype',
  UnrestrictedDerivedPhenotype  = 'unrestricted_derived_phenotype',
  RestrictedSinglePhenotype     = 'restricted_single_phenotype',
  RestrictedCombinedPhenotype   = 'restricted_combined_phenotype',
  RestrictedDerivedPhenotype    = 'restricted_derived_phenotype'
}
