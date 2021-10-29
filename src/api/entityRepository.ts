import { DataType, EntityType, IEntity } from 'src/components/models'

const anthropometry: IEntity = {
  id: 'anthropometry',
  title: 'Anthropometry',
  titles: [
    { lang: 'de', text: 'Anthropometrie' },
    { lang: 'en', text: 'Anthropometry' }
  ],
  entityType: EntityType.Category,
  synonyms: [],
  codes: [],
  descriptions: []
}

const weight: IEntity = {
  id: 'weight',
  title: 'Weight',
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

const _entites: IEntity[] = [
  anthropometry,
  {
    id: 'bmi',
    title: 'BMI',
    titles: [
      { lang: 'de', text: 'BMI' },
      { lang: 'en', text: 'BMI' }
    ],
    entityType: EntityType.SinglePhenotype,
    dataType: DataType.Number,
    synonyms: [],
    descriptions: [],
    codes: [],
    superClass: anthropometry
  },
  {
    id: 'height',
    title: 'Height',
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
    superClass: anthropometry
  },
  weight,
  {
    id: 'weight_1500_to_2500g',
    title: '1500-2500g',
    titles: [],
    entityType: EntityType.SingleRestriction,
    synonyms: [],
    descriptions: [],
    codes: [],
    superClass: weight
  },
  {
    id: 'weight_gt_80kg',
    title: '>80kg',
    titles: [],
    entityType: EntityType.SingleRestriction,
    synonyms: [],
    descriptions: [],
    codes: [],
    superClass: weight
  },
  {
    id: 'laboratory_values',
    title: 'Laboratory Values',
    titles: [
      { lang: 'de', text: 'Laborwerte' },
      { lang: 'en', text: 'Laboratory Values' }
    ],
    entityType: EntityType.Category,
    synonyms: [],
    codes: [],
    descriptions: []
  },
]

// eslint-disable-next-line @typescript-eslint/require-await
export function fetchEntity(id: string): IEntity {
  const result = _entites.filter(e => e.id === id)
  return result[0]
}
