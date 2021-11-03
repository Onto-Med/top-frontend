import { EntityType, DataType, ICode, IRestrictionComponent, IExpression } from 'src/components/models'

export interface IEntity {
  id?: string
  entityType: EntityType
  title?: string
  titles?: Record<string, string>[]
  synonyms?: Record<string, string>[]
  descriptions?: Record<string, string>[]
  dataType?: DataType
  codes?: ICode[]
  score?: number
  units?: string[]
  negated?: boolean
  superClass?: IEntity
  restriction?: IRestrictionComponent[]
  expression?: IExpression
}

export class Entity {
  id?: string
  entityType: EntityType = EntityType.Category
  title?: string
  titles?: Record<string, string>[]
  synonyms?: Record<string, string>[]
  descriptions?: Record<string, string>[]
  dataType?: DataType
  codes?: ICode[]
  score?: number
  units?: string[]
  negated?: boolean
  superClass?: Entity
  restriction?: IRestrictionComponent[]
  expression?: IExpression

  constructor (obj?: IEntity) {
    if (obj) {
      this.id = obj.id
      this.entityType = obj.entityType
      this.title = obj.title
      this.titles = obj.titles
      this.synonyms = obj.synonyms
      this.descriptions = obj.descriptions
      this.dataType = obj.dataType
      this.codes = obj.codes
      this.score = obj.score
      this.units = obj.units
      this.negated = obj.negated
      this.superClass = new Entity(obj.superClass)
      this.restriction = obj.restriction
      this.expression = obj.expression
    }
    this.prepare()
  }

  getIcon (): string {
    if (this.entityType === EntityType.CombinedPhenotype) {
      return 'merge_type'
    } else if (this.entityType === EntityType.DerivedPhenotype) {
      return 'functions'
    } else if (this.entityType === EntityType.SinglePhenotype) {
      switch (this.dataType) {
        case DataType.Number:
          return 'calculate'
        case DataType.DateTime:
          return 'today'
        case DataType.String:
          return 'notes'
        case DataType.Boolean:
          return 'check_box'
      }
    }
    return ''
  }

  getTitle (): string {
		// TODO: incorporate current locale
    return this.titles && this.titles.length > 0 ? this.titles[0].text : this.id as string
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
      this.restriction = [] as IRestrictionComponent[]
    }
    if (this.entityType === EntityType.CombinedRestriction && !this.expression) {
      this.expression = {} as IExpression
    }
  }
}