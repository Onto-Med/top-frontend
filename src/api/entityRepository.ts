import { DataType, EntityType, IEntity } from 'src/components/models'

const _entites: IEntity[] = [
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
  }
]

// eslint-disable-next-line @typescript-eslint/require-await
export function fetchEntity(id: string): IEntity {
  const result = _entites.filter(e => e.id === id)
  return result[0]
}
