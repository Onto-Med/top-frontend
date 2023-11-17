import {
  Category,
  Concept,
  DataType,
  DateTimeRestriction,
  Entity,
  EntityType,
  LocalisableText,
  NumberRestriction,
  Organisation,
  Permission,
  Phenotype,
  Query,
  QueryType,
  Repository,
  RepositoryType,
  RestrictionOperator
} from '@onto-med/top-api'
import { useEntity } from 'src/pinia/entity'
import { useI18n } from 'vue-i18n'

export default function (this: void) {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { locale, t, te } = useI18n()
  const entityStore = useEntity()

  const getLocalizedPropertyValues = (entity: Entity, property: keyof Entity): string[] => {
    const lang = locale.value.split('-')[0]
    if (entity[property]) {
      const results = (entity[property] as LocalisableText[])
        .filter(d => d.lang === lang && d.text.length > 0)
        .map(d => d.text)
      if (results) return results
    }
    return []
  }

  /**
     * Returns a Boolean, indicating if the provided entity is a phenotype.
     * @param entity the entity
     * @returns true if entity is a phenotype
     */
  const isPhenotype = (entity?: Entity): entity is Phenotype => {
    return entity !== undefined
      && [EntityType.CompositePhenotype, EntityType.SinglePhenotype].includes(entity.entityType)
  }

  const isCategory = (entity?: Entity): entity is Category => {
    return entity !== undefined
      && entity.entityType === EntityType.Category
  }

  const isConcept = (entity?: Entity): entity is Concept => {
    return entity !== undefined
      && [EntityType.CompositeConcept, EntityType.SingleConcept].includes(entity.entityType)
  }

  /**
     * Returns a Boolean, indicating if the provided entity is restricted.
     * @param entity the entity
     * @returns true if entity is restricted
     */
  const isRestricted = (entity: Entity | EntityType): entity is Phenotype => {
    return [EntityType.CompositeRestriction, EntityType.SingleRestriction].includes(
      entity.hasOwnProperty('id') ? (entity as Entity).entityType : (entity as EntityType)
    )
  }

  /**
     * Get a title for the provided entity. The resulting title is derived from the titles field.
     * A title, were lang matches the currently selected language for i18n, is priortized.
     * If the entity has no titles, 'unnamed entity' is returned.
     * @param entity the entity
     * @param prefix add title of super phenotype as prefix
     * @param unit add unit as suffix
     * @returns the title
     */
  const getTitle = (entity?: Entity, prefix?: boolean, unit?: boolean): string => {
    if (!entity) return t('unnamedEntity')
    const lang = locale.value.split('-')[0]
    let superPhenotypePrefix = ''
    let title = ''

    if (prefix && isRestricted(entity) && entity.superPhenotype) {
      const superPhenotype = entityStore.getEntity(entity.superPhenotype.id)
      superPhenotypePrefix += getTitle(superPhenotype || entity.superPhenotype) + ': '
    }

    if (entity.titles) {
      const result = entity.titles.filter(t => t.lang === lang).shift()
      if (result && result.text) title = result.text
      else if (entity.titles[0] && entity.titles[0].text) title = entity.titles[0].text
    }

    if (!title) {
      if (isCategory(entity))
        title = t('unnamedCategory')
      else if (isPhenotype(entity))
        title = t('unnamedPhenotype')
      else if (isRestricted(entity))
        title = t('unnamedRestriction')
      else if (isConcept(entity))
        title = t('unnamedConcept')
    }

    if (unit && isPhenotype(entity) && entity.unit)
      title += ' [' + entity.unit + ']'

    return superPhenotypePrefix + title
  }

  const invertOperator = (operator: RestrictionOperator): RestrictionOperator => {
    switch (operator) {
      case RestrictionOperator.GreaterThan: return RestrictionOperator.LessThan
      case RestrictionOperator.GreaterThanOrEqualTo: return RestrictionOperator.LessThanOrEqualTo
      case RestrictionOperator.LessThan: return RestrictionOperator.GreaterThan
      case RestrictionOperator.LessThanOrEqualTo: return RestrictionOperator.GreaterThanOrEqualTo
    }
  }

  return {
    isPhenotype,
    isCategory,
    isRestricted,
    isConcept,
    getTitle,

    hasDataType: (entity: Entity | EntityType) => {
      return [EntityType.CompositePhenotype, EntityType.SinglePhenotype].includes(
        entity.hasOwnProperty('id') ? (entity as Entity).entityType : entity as EntityType
      )
    },

    hasItemType: (entity: Entity | EntityType) => {
      return [EntityType.SinglePhenotype].includes(
        entity.hasOwnProperty('id') ? (entity as Entity).entityType : entity as EntityType
      )
    },

    /**
     * Get an appropriate material icon name for the provided entity.
     * When building an icon, you should make restrictions visually distinguishable from phenotypes.
     * @param entity the entity
     * @returns Material icon name as string
     */
    getIcon(this: void, entity: Entity): string {
      if ([EntityType.CompositePhenotype, EntityType.CompositeRestriction, EntityType.CompositeConcept].includes(entity.entityType)) {
        return 'apps'
      } else if ([EntityType.SinglePhenotype, EntityType.SingleRestriction].includes(entity.entityType)) {
        switch ((entity as Phenotype).dataType) {
          case DataType.Number:
            return 'pin'
          case DataType.DateTime:
            return 'today'
          case DataType.String:
            return 'article'
          case DataType.Boolean:
            return 'flaky'
          default:
            return 'help_center'
        }
      } else if (entity.entityType === EntityType.SingleConcept) {
        return 'font_download'
      }
      return 'folder'
    },

    /**
     * Get a localised tooltip that can be added to an icon, built with the getIcon() method.
     * @param entity the entity
     * @returns Tooltip string
     */
    getIconTooltip(this: void, entity: Entity): string {
      const result = t(entity.entityType)
      if ([EntityType.SinglePhenotype, EntityType.SingleRestriction].includes(entity.entityType)) {
        const dataType = (entity as Phenotype).dataType
        result + (dataType ? ': ' + t(dataType.valueOf()) : '')
      }
      return result
    },

    /**
     * Get all synonyms of the provided entity for the currently selected language.
     * @param entity the entity
     * @returns the synonyms
     */
    getSynonyms(this: void, entity: Entity): string[] {
      return getLocalizedPropertyValues(entity, 'synonyms')
    },

    /**
     * Get all descripitons of the provided entity for the currently selected language.
     * @param entity the entity
     * @returns the descriptions
     */
    getDescriptions(this: void, entity: Entity): string[] {
      return getLocalizedPropertyValues(entity, 'descriptions')
    },

    hasExpression(this: void, entity: Entity | EntityType): entity is Phenotype {
      const entityType = (entity.hasOwnProperty('id') ? (entity as Entity).entityType : entity) as EntityType
      return [EntityType.CompositePhenotype, EntityType.CompositeConcept].includes(entityType)
    },

    restrictionEntityTypes(this: void): EntityType[] {
      return [
        EntityType.SinglePhenotype,
        EntityType.CompositeRestriction,
        EntityType.SingleRestriction
      ]
    },

    restrictionToString(this: void, restriction?: NumberRestriction | DateTimeRestriction): string {
      let result = ''
      if (restriction?.values?.length !== 0) {
        const values = restriction?.values as (number | Date | string)[]
        if (restriction?.minOperator || restriction?.maxOperator) {
          if (restriction?.minOperator && values[0]) {
            result += `${values[0].toString()} ${invertOperator(restriction.minOperator)} x`
          }
          if (restriction?.maxOperator && values[1]) {
            if (result === '') result += 'x'
            result += ` ${restriction.maxOperator} ${values[1].toString()}`
          }
        } else {
          result += values.join(', ').substring(0, 100)
        }
      } else {
        return t('unnamedRestriction')
      }
      return result
    },

    phenotypeEntityTypes(this: void): EntityType[] {
      return [
        EntityType.CompositePhenotype,
        EntityType.SinglePhenotype,
        EntityType.SingleRestriction,
        EntityType.CompositeRestriction
      ]
    },

    repositoryIcon: (repository: Repository | RepositoryType) => {
      const type = repository.hasOwnProperty('id') ? (repository as Repository).repositoryType : repository as RepositoryType
      if (type === RepositoryType.ConceptRepository) return 'article'
      if (type === RepositoryType.PhenotypeRepository) return 'category'
      return 'tab'
    },

    queryIcon: (query: Query | QueryType) => {
      const type = query.hasOwnProperty('id') ? (query as Query).type : query as QueryType
      if (type === QueryType.Concept) return 'article'
      if (type === QueryType.Phenotype) return 'category'
      return 'question_mark'
    },

    requiresAggregationFunction: (entity: Entity) => {
      return [EntityType.CompositePhenotype, EntityType.CompositeRestriction].includes(entity.entityType)
    },

    permissionTitle: (permission?: Permission) => {
      if (!permission) return t('permission', 0)
      return te('permissions.' + permission)
        ? t('permissions.' + permission)
        : permission
    },

    canRead: (organisation?: Organisation) => {
      if (!organisation?.permission) return false
      return [Permission.Manage, Permission.Write, Permission.Read].includes(organisation.permission)
    },

    canWrite: (organisation?: Organisation) => {
      if (!organisation?.permission) return false
      return [Permission.Manage, Permission.Write].includes(organisation.permission)
    },

    canManage: (organisation?: Organisation) => {
      return Permission.Manage === organisation?.permission
    },

    paginationLabel: (firstRowIndex: number, endRowIndex: number, totalRowNumber: number) => {
      return `${firstRowIndex}-${endRowIndex} ${t('of')} ${totalRowNumber}`
    }
  }
}
