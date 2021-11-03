import { DataType, EntityType, IEntityTreeNode, RestrictionOperator, IExpression, ExpressionType } from 'src/components/models'
import { Entity, IEntity } from 'src/models/Entity'

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
    entityType: EntityType.SinglePhenotype,
    dataType: DataType.Number,
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
    restriction: [
      { operator: RestrictionOperator.GreaterEqual, value: 1500 },
      { operator: RestrictionOperator.LowerEqual, value: 2500 }
    ]
  },
  {
    id: 'weight_gt_80kg',
    titles: [ { lang: 'en', text: '>80kg' } ],
    entityType: EntityType.SingleRestriction,
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
export function fetchEntity (id: string): Entity {
  const result = _entites.filter(e => e.id === id)
  return new Entity(result[0])
}

export async function searchEntitiesByTitle(title: string): Promise<Entity[]> {
  await new Promise(r => setTimeout(r, 1000))
  const needle = title.toLowerCase()
  return _entites
    .filter(e => e.id?.includes(needle) || e.titles && e.titles.filter(t => t.text.toLowerCase().includes(needle)).length > 0)
    .map(e => new Entity(e))
}

export function fetchEntityTree (): IEntityTreeNode[] {
  return [
    {
      id: 'anthropometry',
      label: 'Anthropometry',
      children: [
        { id: 'bmi', label: 'BMI', icon: 'calculate' },
        { id: 'height', label: 'Height', icon: 'calculate' },
        {
          id: 'weight',
          label: 'Weight',
          icon: 'calculate',
          children: [
            { id: 'weight_1500_to_2500g', label: '1500-2500g' },
            { id: 'weight_gt_80kg', label: '>80kg' }
          ]
        }
      ]
    },
    {
      id: 'laboratory_values',
      label: 'Laboratory values',
      children: [
        {
          id: 'combined_phenotype',
          label: 'Combined Phenotype',
          icon: 'merge_type',
          children: [
            { id: 'combined_restriction', label: 'Combined Restriction' }
          ]
        }
      ]
    }
  ]
}
