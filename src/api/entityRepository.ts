import { DataType, EntityType, IEntity, IEntityTreeNode, IRestrictionComponent, RestrictionOperator, ICode, IExpression } from 'src/components/models'

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

const laboratoryValues: IEntity = {
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
}

const combinedPhenotype: IEntity = {
  id: 'combined_phenotype',
  title: 'Combined Phenotype',
  entityType: EntityType.CombinedPhenotype,
  superClass: laboratoryValues
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
    title: '>80kg',
    titles: [],
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
    title: 'Combined Restriction',
    entityType: EntityType.CombinedRestriction,
    superClass: combinedPhenotype
  }
]

// eslint-disable-next-line @typescript-eslint/require-await
export function fetchEntity (id: string): IEntity {
  const result = _entites.filter(e => e.id === id)
  const entity = result[0]

  if (!entity.titles) entity.titles = [] as Record<string, string>[]
  if (!entity.synonyms) entity.synonyms = [] as Record<string, string>[]
  if (!entity.descriptions) entity.descriptions = [] as Record<string, string>[]
  if (!entity.codes) entity.codes = [] as ICode[]

  if ([EntityType.SingleRestriction, EntityType.DerivedRestriction].includes(entity.entityType) && !entity.restriction) {
    entity.restriction = [] as IRestrictionComponent[]
  }
  if (entity.entityType === EntityType.CombinedRestriction && !entity.expression) {
    entity.expression = {} as IExpression;
  }

  return entity
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
