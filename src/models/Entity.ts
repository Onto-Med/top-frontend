import { EntityType, DataType, ICode, IRestriction, IExpression, IUserAccount } from 'src/components/models'
import { useI18n } from 'vue-i18n'
import { v4 as uuidv4 } from 'uuid'

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
  superClass?: IEntity
  subClasses?: IEntity[]
  restriction?: IRestriction
  expression?: IExpression
  createdAt?: Date
  updatedAt?: Date
  author?: IUserAccount
}

export class Entity {
  id: string = (uuidv4 as () => string)()
  entityType: EntityType = EntityType.Category
  titles?: Record<string, string>[]
  synonyms?: Record<string, string>[]
  descriptions?: Record<string, string>[]
  dataType?: DataType
  codes?: ICode[]
  score?: number
  units?: string[]
  superClass?: Entity
  subClasses?: Entity[]
  restriction?: IRestriction
  expression?: IExpression
  createdAt?: Date
  updatedAt?: Date
  author?: IUserAccount

  constructor (obj?: IEntity) {
    if (obj) {
      if (obj.id) this.id = obj.id
      this.entityType = obj.entityType
      this.titles = obj.titles
      this.synonyms = obj.synonyms
      this.descriptions = obj.descriptions
      this.dataType = obj.dataType
      this.codes = obj.codes
      this.score = obj.score
      this.units = obj.units
      this.superClass = obj.superClass ? new Entity(obj.superClass) : undefined
      this.subClasses = obj.subClasses?.map(c => new Entity(c))
      this.restriction = obj.restriction
      this.expression = obj.expression
      this.createdAt = obj.createdAt
      this.updatedAt = obj.updatedAt
      this.author = obj.author
    }
    this.prepare()
  }

  /**
   * Apply field values of another entity to this entity.
   * The id field is not transfered.
   * 
   * @param entity The other entity, of which field values are transfered to this entity.
   */
  apply (entity: Entity): void {
    this.entityType = entity.entityType
    this.titles = entity.titles
    this.synonyms = entity.synonyms
    this.descriptions = entity.descriptions
    this.dataType = entity.dataType
    this.codes = entity.codes
    this.score = entity.score
    this.units = entity.units
    this.superClass = entity.superClass
    this.subClasses = entity.subClasses
    this.restriction = entity.restriction
    this.expression = entity.expression
    this.createdAt = entity.createdAt
    this.updatedAt = entity.updatedAt
    this.author = entity.author
  }

  isRestriction (): boolean {
    return [EntityType.CombinedRestriction, EntityType.SingleRestriction, EntityType.DerivedRestriction].includes(this.entityType)
  }

  /**
   * Get an appropriate material icon name for this entity.
   * When building an icon, you should make restrictions visually distinguishable from phenotypes.
   * @returns Material icon name as string
   */
  getIcon (): string {
    if ([EntityType.CombinedPhenotype, EntityType.CombinedRestriction].includes(this.entityType)) {
      return 'merge_type'
    } else if ([EntityType.DerivedPhenotype, EntityType.DerivedRestriction].includes(this.entityType)) {
      return 'calculate'
    } else if ([EntityType.SinglePhenotype, EntityType.SingleRestriction].includes(this.entityType)) {
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
    return 'folder'
  }

  getIconTooltip (): string {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    return t(this.entityType) + (this.dataType ? ': ' + t(this.dataType) : '')
  }

  /**
   * Get a title for the entity. The resulting title is derived from the titles field.
   * A title, were lang matches the currently selected language for i18n, is priortized.
   * If the entity has no titles, 'unnamed entity' is returned.
   * @returns the title
   */
  getTitle (): string {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { locale, t } = useI18n({ useScope: 'global' })
    const lang = locale.value.split('-')[0]
    if (this.titles) {
      const result = this.titles.filter(t => t.lang === lang).shift()
      if (result && result.text) return result.text
      if (this.titles[0] && this.titles[0].text) return this.titles[0].text
    }
    return t('unnamedEntity')
  }

  getSynonyms (): string[] {
    return this.getLocalizedPropertyValues('synonyms')
  }

  getDescriptions (): string[] {
    return this.getLocalizedPropertyValues('descriptions')
  }

  getLocalizedPropertyValues (property: keyof Entity): string[] {
    const { locale } = useI18n({ useScope: 'global' })
    const lang = locale.value.split('-')[0]
    if (this[property]) {
      const results = (this[property] as Record<string, string>[])
        .filter(d => d.lang === lang && d.text.length > 0)
        .map(d => d.text)
      if (results) return results
    }
    return []
  }

  clone (): Entity {
    return new Entity(JSON.parse(JSON.stringify(this)))
  }

  equals (obj: unknown): boolean {
    return JSON.stringify(this) === JSON.stringify(obj)
  }

  private prepare (): void {
    if (!this.titles) this.titles = [] as Record<string, string>[]
    if (!this.synonyms) this.synonyms = [] as Record<string, string>[]
    if (!this.descriptions) this.descriptions = [] as Record<string, string>[]
    if (!this.codes) this.codes = [] as ICode[]
    if (!this.units) this.units = []
  
    if ([EntityType.SingleRestriction, EntityType.DerivedRestriction].includes(this.entityType) && !this.restriction) {
      this.restriction = { type: this.dataType, values: [] } as IRestriction
    }
    if (this.entityType === EntityType.CombinedRestriction && !this.expression) {
      this.expression = {} as IExpression
    }
    if (this.restriction && this.restriction.negated === undefined) {
      this.restriction.negated = false
    }
  }
}