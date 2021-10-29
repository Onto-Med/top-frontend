import { DataType, EntityType, IEntity } from 'src/components/models'

const _entites: IEntity[] = [
  {
    id: 'anthropometry',
    title: 'Anthropometry',
    titles: [
      { lang: 'de', text: 'Anthropometrie' },
      { lang: 'en', text: 'Anthropometry' }
    ],
    entityType: EntityType.Category,
    synonyms: [],
    descriptions: []
  },
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
    descriptions: []
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
    ]
  },
  {
    id: 'weight',
    title: 'Weight',
    titles: [
      { lang: 'de', text: 'Gewicht' },
      { lang: 'en', text: 'Weight' }
    ],
    entityType: EntityType.SinglePhenotype,
    dataType: DataType.Number,
    synonyms: [],
    descriptions: []
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
    descriptions: []
  },
]

// eslint-disable-next-line @typescript-eslint/require-await
export function fetchEntity(id: string): IEntity {
  const result = _entites.filter(e => e.id === id)
  return result[0]
}
