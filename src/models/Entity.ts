import { EntityType, DataType, ICode, IRestriction, IExpression } from 'src/components/models'
import { useI18n } from 'vue-i18n'

export interface IEntity {
  id?: string
  entityType: EntityType
  titles?: Record<string, string>[]
  synonyms?: Record<string, string>[]
  descriptions?: Record<string, string>[]
  dataType?: DataType
  codes?: ICode[]
  score?: number
  units?: string[]
  negated?: boolean
  superClass?: IEntity
  subClasses?: Entity[]
  restriction?: IRestriction
  expression?: IExpression
}

export class Entity {
  id?: string
  entityType: EntityType = EntityType.Category
  titles?: Record<string, string>[]
  synonyms?: Record<string, string>[]
  descriptions?: Record<string, string>[]
  dataType?: DataType
  codes?: ICode[]
  score?: number
  units?: string[]
  negated?: boolean
  superClass?: Entity
  subClasses?: Entity[]
  restriction?: IRestriction
  expression?: IExpression

  constructor (obj?: IEntity) {
    if (obj) {
      this.id = obj.id
      this.entityType = obj.entityType
      this.titles = obj.titles
      this.synonyms = obj.synonyms
      this.descriptions = obj.descriptions
      this.dataType = obj.dataType
      this.codes = obj.codes
      this.score = obj.score
      this.units = obj.units
      this.negated = obj.negated
      this.superClass = obj.superClass ? new Entity(obj.superClass) : undefined
      this.subClasses = obj.subClasses
      this.restriction = obj.restriction
      this.expression = obj.expression
    }
    this.prepare()
  }

  getIcon (): string {
    if (this.entityType === EntityType.CombinedPhenotype) {
      return 'merge_type'
    } else if (this.entityType === EntityType.DerivedPhenotype) {
      return 'calculate'
    } else if (this.entityType === EntityType.SinglePhenotype) {
      switch (this.dataType) {
        case DataType.Number:
          return 'pin'
        case DataType.DateTime:
          return 'today'
        case DataType.String:
          return 'article'
        case DataType.Boolean:
          return 'check_box'
      }
    }
    return ''
  }

  getIconTooltip (): string {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    return t(this.entityType) + (this.dataType ? ': ' + t(this.dataType) : '')
  }

  getTitle (): string {
    const { locale } = useI18n({ useScope: 'global' })
    const lang = locale.value.split('-')[0]
    if (this.titles) {
      const result = this.titles.filter(t => t.lang === lang).shift()
      if (result && result.text) return result.text
      if (this.titles[0] && this.titles[0].text) return this.titles[0].text
    }
    return this.id as string
  }

  clone (): Entity {
    return new Entity(JSON.parse(JSON.stringify(this)))
  }

  equals (obj: unknown): boolean {
    return JSON.stringify(this) !== JSON.stringify(obj)
  }

  private prepare (): void {
    if (!this.titles) this.titles = [] as Record<string, string>[]
    if (!this.synonyms) this.synonyms = [] as Record<string, string>[]
    if (!this.descriptions) this.descriptions = [] as Record<string, string>[]
    if (!this.codes) this.codes = [] as ICode[]
  
    if ([EntityType.SingleRestriction, EntityType.DerivedRestriction].includes(this.entityType) && !this.restriction) {
      this.restriction = { type: this.dataType, values: [] } as IRestriction
    }
    if (this.entityType === EntityType.CombinedRestriction && !this.expression) {
      this.expression = {} as IExpression
    }
  }
}