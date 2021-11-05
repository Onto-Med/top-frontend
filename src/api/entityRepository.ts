import { DataType, EntityType, RestrictionOperator, IExpression, ExpressionType, QuantorType } from 'src/components/models'
import { Entity, IEntity } from 'src/models/Entity'
import { useI18n } from 'vue-i18n'

const anthropometry: IEntity = {
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

const weight: IEntity = {
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

const laboratoryValues: IEntity = {
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

const combinedPhenotype: IEntity = {
  id: 'combined_phenotype',
  titles: [ { lang: 'en', text: 'Combined Phenotype' } ],
  entityType: EntityType.CombinedPhenotype,
  superClass: laboratoryValues
}

const _entites: IEntity[] = [
  anthropometry,
  {
    id: 'bmi',
    titles: [
      { lang: 'de', text: 'BMI' },
      { lang: 'en', text: 'BMI' }
    ],
    entityType: EntityType.DerivedPhenotype,
    synonyms: [],
    descriptions: [],
    codes: [],
    superClass: anthropometry
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
      quantor: QuantorType.All,
      minOperator: RestrictionOperator.GreaterEqual,
      maxOperator: RestrictionOperator.LowerEqual,
      values: [ 1500, 2500 ]
    }
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
            { type: ExpressionType.Class, id: 'height' }
          ]
        }
      ]
    } as IExpression
  }
]

// eslint-disable-next-line @typescript-eslint/require-await
export async function fetchEntity (id: string): Promise<Entity> {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { t } = useI18n()
  await new Promise(r => setTimeout(r, 1000))
  const result = _entites.filter(e => e.id === id)
  if (result && result.length > 0) return new Entity(result[0])
  throw new Error(t('not found'))
}

export async function searchEntitiesByTitle(title: string): Promise<Entity[]> {
  await new Promise(r => setTimeout(r, 1000))
  const needle = title.toLowerCase()
  return _entites
    .filter(e => e.id?.includes(needle) || e.titles && e.titles.filter(t => t.text.toLowerCase().includes(needle)).length > 0)
    .map(e => new Entity(e))
}

export async function fetchEntityTree (): Promise<Entity[]> {
  await new Promise(r => setTimeout(r, 1000))
  return [
    new Entity({
      id: 'anthropometry',
      titles: [
        { lang: 'de', text: 'Anthropometrie' },
        { lang: 'en', text: 'Anthropometry' }
      ],
      entityType: EntityType.Category,
      subClasses: [
        new Entity({
          id: 'bmi',
          titles: [
            { lang: 'de', text: 'BMI' },
            { lang: 'en', text: 'BMI' }
          ],
          entityType: EntityType.DerivedPhenotype,
          dataType: DataType.Number
        }),
        new Entity({
          id: 'height',
          titles: [
            { lang: 'de', text: 'Größe' },
            { lang: 'en', text: 'Height' }
          ],
          descriptions: [
            { lang: 'de', text: 'Beispielbeschreibung' },
            { lang: 'en', text: 'Example description' }
          ],
          entityType: EntityType.SinglePhenotype,
          dataType: DataType.Number,
        }),
        new Entity({
          id: 'weight',
          titles: [
            { lang: 'de', text: 'Gewicht' },
            { lang: 'en', text: 'Weight' }
          ],
          entityType: EntityType.SinglePhenotype,
          dataType: DataType.Number,
          subClasses: [
            new Entity({
              id: 'weight_1500_to_2500g',
              titles: [ { lang: 'en', text: '1500-2500g' } ],
              entityType: EntityType.SingleRestriction,
              dataType: DataType.Number,
            }),
            new Entity({
              id: 'weight_gt_80kg',
              titles: [ { lang: 'en', text: '>80kg' } ],
              entityType: EntityType.SingleRestriction,
              dataType: DataType.Number,
            })
          ]
        })
      ]
    }),
    new Entity({
      id: 'laboratory_values',
      titles: [
        { lang: 'de', text: 'Laborwerte' },
        { lang: 'en', text: 'Laboratory Values' }
      ],
      entityType: EntityType.Category,
      subClasses: [
        new Entity({
          id: 'combined_phenotype',
          titles: [ { lang: 'en', text: 'Combined Phenotype' } ],
          entityType: EntityType.CombinedPhenotype,
          subClasses: [
            new Entity({
              id: 'combined_restriction',
              titles: [ { lang: 'en', text: 'Combined Restriction' } ],
              entityType: EntityType.CombinedRestriction,
            })
          ]
        })
      ]
    })
  ]
}
