import { Category, DataType, Entity, EntityType, LocalisableText, Phenotype } from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'

export default function (this: void) {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { locale, t } = useI18n()

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
  const isPhenotype = (entity: Entity): entity is Phenotype => {
    return [EntityType.CompositePhenotype, EntityType.SinglePhenotype].includes(entity.entityType)
  }

  const isCategory = (entity: Entity): entity is Category => {
    return entity.entityType === EntityType.Category
  }

  /**
     * Returns a Boolean, indicating if the provided entity is restricted.
     * @param entity the entity
     * @returns true if entity is restricted
     */
  const isRestricted = (entity: Entity|EntityType): entity is Phenotype => {
    return [EntityType.CompositeRestriction, EntityType.SingleRestriction].includes(
      entity.hasOwnProperty('id') ? (entity as Entity).entityType : (entity as EntityType)
    )
  }

  /**
     * Get a title for the provided entity. The resulting title is derived from the titles field.
     * A title, were lang matches the currently selected language for i18n, is priortized.
     * If the entity has no titles, 'unnamed entity' is returned.
     * @param entity the entity
     * @returns the title
     */
  const getTitle = (entity: Entity, prefix?: boolean): string => {
    const lang = locale.value.split('-')[0]
    let superPhenotypePrefix = ''

    if (prefix && isRestricted(entity) && entity.superPhenotype) {
      superPhenotypePrefix += getTitle(entity.superPhenotype) + ': '
    }

    if (entity.titles) {
      const result = entity.titles.filter(t => t.lang === lang).shift()
      if (result && result.text) return superPhenotypePrefix + result.text
      if (entity.titles[0] && entity.titles[0].text) return superPhenotypePrefix + entity.titles[0].text
    }
    if (isCategory(entity))
      return t('unnamedCategory')
    else if (isPhenotype(entity))
      return t('unnamedPhenotype')

    return superPhenotypePrefix + t('unnamedRestriction')
  }

  return {
    isPhenotype,
    isCategory,
    isRestricted,
    getTitle,

    hasDataType: (entity: Entity|EntityType) => {
      return [EntityType.CompositePhenotype, EntityType.SinglePhenotype].includes(
        entity.hasOwnProperty('id') ? (entity as Entity).entityType : entity as EntityType
      )
    },

    hasItemType: (entity: Entity|EntityType) => {
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
    getIcon (this: void, entity: Entity): string {
      if ([EntityType.CompositePhenotype, EntityType.CompositeRestriction].includes(entity.entityType)) {
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
      }
      return 'folder'
    },

    /**
     * Get a localised tooltip that can be added to an icon, built with the getIcon() method.
     * @param entity the entity
     * @returns Tooltip string
     */
    getIconTooltip (this: void, entity: Entity): string {
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
    getSynonyms (this: void, entity: Entity): string[] {
      return getLocalizedPropertyValues(entity, 'synonyms')
    },

    /**
     * Get all descripitons of the provided entity for the currently selected language.
     * @param entity the entity
     * @returns the descriptions
     */
    getDescriptions (this: void, entity: Entity): string[] {
      return getLocalizedPropertyValues(entity, 'descriptions')
    },

    hasExpression (this: void, entity: Entity|EntityType): entity is Phenotype {
      const entityType = entity.hasOwnProperty('id') ? (entity as Entity).entityType : entity
      return entityType === EntityType.CompositeRestriction
    },

    restrictionEntityTypes (this: void): EntityType[] {
      return [
        EntityType.SinglePhenotype,
        EntityType.CompositeRestriction,
        EntityType.SingleRestriction
      ]
    },

    phenotypeEntityTypes (this: void): EntityType[] {
      return [
        EntityType.CompositePhenotype,
        EntityType.SinglePhenotype,
        EntityType.SingleRestriction,
        EntityType.CompositeRestriction
      ]
    }
  }
}
