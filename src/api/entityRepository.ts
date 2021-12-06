import { DataType, EntityType, Expression, ExpressionType, NumberRestriction, Quantor, RestrictionOperator, UserAccount } from '@onto-med/top-api'
import { FullEntity, PhenotypeInTaxonomy } from 'src/models/Entity'

const anthropometry: PhenotypeInTaxonomy = {
  id: 'anthropometry',
  titles: [
    { lang: 'de', text: 'Anthropometrie' },
    { lang: 'en', text: 'Anthropometry' }
  ],
  entityType: EntityType.Category,
  synonyms: [],
  codes: [],
  descriptions: []
}

const bmi: PhenotypeInTaxonomy = {
  id: 'bmi',
  titles: [
    { lang: 'de', text: 'BMI' },
    { lang: 'en', text: 'BMI' }
  ],
  entityType: EntityType.DerivedPhenotype,
  dataType: DataType.Number,
  synonyms: [],
  descriptions: [],
  codes: [],
  superClass: anthropometry,
  formula: 'weight / height^(2)'
}

const weight: PhenotypeInTaxonomy = {
  id: 'weight',
  titles: [
    { lang: 'de', text: 'Gewicht' },
    { lang: 'en', text: 'Weight' }
  ],
  entityType: EntityType.SinglePhenotype,
  dataType: DataType.Number,
  synonyms: [],
  descriptions: [],
  codes: [],
  superClass: anthropometry
}

const laboratoryValues: PhenotypeInTaxonomy = {
  id: 'laboratory_values',
  titles: [
    { lang: 'de', text: 'Laborwerte' },
    { lang: 'en', text: 'Laboratory Values' }
  ],
  entityType: EntityType.Category,
  synonyms: [],
  codes: [],
  descriptions: []
}

const combinedPhenotype: PhenotypeInTaxonomy = {
  id: 'combined_phenotype',
  titles: [ { lang: 'en', text: 'Combined Phenotype' } ],
  entityType: EntityType.CombinedPhenotype,
  superClass: laboratoryValues
}

const _entites: PhenotypeInTaxonomy[] = [
  anthropometry,
  bmi,
  {
    id: 'bmi_gt_30kg/m2',
    titles: [
      { lang: 'en', text: 'BMI > 30kg/m²' }
    ],
    codes: [
      { code: '162864005', codeSystem: { uri: 'http://snomed.info/id', name: 'SNOMED CT' } }
    ],
    entityType: EntityType.DerivedRestriction,
    dataType: DataType.Number,
    superClass: bmi,
    restriction: {
      type: DataType.Number,
      negated: false,
      quantor: Quantor.Some,
      minOperator: RestrictionOperator.GreaterThan,
      values: [ 30 ]
    } as NumberRestriction
  },
  {
    id: 'height',
    titles: [
      { lang: 'de', text: 'Größe' },
      { lang: 'en', text: 'Height' }
    ],
    entityType: EntityType.SinglePhenotype,
    dataType: DataType.Number,
    synonyms: [],
    descriptions: [
      { lang: 'de', text: 'Beispielbeschreibung' },
      { lang: 'en', text: 'Example description' }
    ],
    codes: [],
    units: [ { unit: 'cm' }, { unit: 'm' }],
    superClass: anthropometry
  },
  weight,
  {
    id: 'weight_1500_to_2500g',
    titles: [ { lang: 'en', text: '1500-2500g' } ],
    entityType: EntityType.SingleRestriction,
    dataType: DataType.Number,
    synonyms: [],
    descriptions: [],
    codes: [],
    superClass: weight,
    restriction: {
      type: DataType.Number,
      negated: true,
      quantor: Quantor.All,
      minOperator: RestrictionOperator.GreaterThan,
      maxOperator: RestrictionOperator.LessThanOrEqualTo,
      values: [ 1500, 2500 ]
    } as NumberRestriction
  },
  {
    id: 'weight_gt_80kg',
    titles: [ { lang: 'en', text: '>80kg' } ],
    entityType: EntityType.SingleRestriction,
    dataType: DataType.Number,
    synonyms: [],
    descriptions: [],
    codes: [],
    superClass: weight
  },
  laboratoryValues,
  combinedPhenotype,
  {
    id: 'combined_restriction',
    titles: [ { lang: 'en', text: 'Combined Restriction' } ],
    entityType: EntityType.CombinedRestriction,
    superClass: combinedPhenotype,
    expression: {
      type: ExpressionType.Union,
      operands: [
        { type: ExpressionType.Restriction, id: 'weight_1500_to_2500g' },
        {
          type: ExpressionType.Complement,
          operands: [
            { type: ExpressionType.Class, id: 'bmi_gt_30kg/m2' }
          ]
        }
      ]
    } as Expression
  }
]

// eslint-disable-next-line @typescript-eslint/require-await
export async function fetchEntity (id: string): Promise<FullEntity> {
  await new Promise(r => setTimeout(r, 500))
  const result = _entites.filter(e => e.id === id)
  if (result && result.length > 0) return new FullEntity(result[0])
  throw new Error('Not Found!')
}

export async function searchEntities (title: string, entityTypes?: EntityType[]): Promise<FullEntity[]> {
  await new Promise(r => setTimeout(r, 500))
  const needle = title.toLowerCase()
  return _entites
    .filter(e =>
      (!entityTypes || entityTypes.length === 0 || entityTypes.includes(e.entityType))
      && (
        e.id?.includes(needle)
        || e.titles && e.titles.filter(t => t.text.toLowerCase().includes(needle)).length > 0
      )
    )
    .map(e => new FullEntity(e))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteEntity (entityId: string): Promise<void> {
  await new Promise(r => setTimeout(r, 500))
  throw new Error('Not implemented!')
}

export async function fetchEntityTree (): Promise<FullEntity[]> {
  await new Promise(r => setTimeout(r, 500))
  return toDataTree(_entites).map(e => new FullEntity(e))
}

export async function fetchEntityVersions (entityId: string): Promise<FullEntity[]> {
  const entity = await fetchEntity(entityId)
  return [ new FullEntity({
    entityType: entity.entityType,
    titles: [{ lang: 'de', text: 'Beispieltitel' }],
    createdAt: new Date(),
    author: { username: 'user', email: 'user@example.com', id: '1' } as UserAccount
  }) ]
}

const toDataTree = (entities: PhenotypeInTaxonomy[]): PhenotypeInTaxonomy[] => {
  const hashTable: Record<string, PhenotypeInTaxonomy> = {}
  const dataTree: PhenotypeInTaxonomy[] = []

  entities.forEach(entity => {
    if (entity.id) hashTable[entity.id] = { ...entity, subClasses: [] }
  })

  entities.forEach(entity => {
    if (entity.id && entity.superClass && entity.superClass.id)
      hashTable[entity.superClass.id].subClasses?.push(hashTable[entity.id])
    else if (entity.id)
      dataTree.push(hashTable[entity.id])
  })

  return dataTree
}
