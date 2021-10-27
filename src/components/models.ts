export interface IPhenotype {
  id: string;
  title: string;
  entityType: EntityType;
  titles: Array<Record<string, string>>;
  datatype: string;
  synonyms: Array<Record<string, string>>;
  descriptions: Array<Record<string, string>>;
}

enum EntityType {
  category = 'category',
  missing_value_phenotype = 'missing_value_phenotype',
  group_phenotype = 'group_phenotype',
  unrestricted_single_phenotype = 'unrestricted_single_phenotype',
  restricted_single_phenotype = 'restricted_single_phenotype',
  unrestricted_combined_phenotype = 'unrestricted_combined_phenotype',
  restricted_combined_phenotype = 'restricted_combined_phenotype',
  unrestricted_derived_phenotype = 'unrestricted_derived_phenotype',
  restricted_derived_phenotype = 'restricted_derived_phenotype'
}