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
    return [EntityType.SinglePhenotype, EntityType.CombinedPhenotype, EntityType.DerivedPhenotype].includes(entity.entityType)
  }

  const isCategory = (entity: Entity): entity is Category => {
    return entity.entityType === EntityType.Category
  }

  return {
    isPhenotype,
    isCategory,

    hasDataType: (entity: Entity) => {
      return entity.entityType == EntityType.SinglePhenotype
    },

    /**
     * Get an appropriate material icon name for the provided entity.
     * When building an icon, you should make restrictions visually distinguishable from phenotypes.
     * @param entity the entity
     * @returns Material icon name as string
     */
    getIcon (this: void, entity: Entity): string {
      if ([EntityType.CombinedPhenotype, EntityType.CombinedRestriction].includes(entity.entityType)) {
        return 'merge_type'
      } else if ([EntityType.DerivedPhenotype, EntityType.DerivedRestriction].includes(entity.entityType)) {
        return 'calculate'
      } else if ([EntityType.SinglePhenotype, EntityType.SingleRestriction].includes(entity.entityType)) {
        switch ((entity as Phenotype).dataType) {
          case DataType.Number:
            return 'pin'
          case DataType.DateTime:
            return 'today'
          case DataType.String:
            return 'article'
          case DataType.Boolean:
            return 'check_box'
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
     * Get a title for the provided entity. The resulting title is derived from the titles field.
     * A title, were lang matches the currently selected language for i18n, is priortized.
     * If the entity has no titles, 'unnamed entity' is returned.
     * @param entity the entity
     * @returns the title
     */
    getTitle (this: void, entity: Entity): string {
      const lang = locale.value.split('-')[0]
      if (entity.titles) {
        const result = entity.titles.filter(t => t.lang === lang).shift()
        if (result && result.text) return result.text
        if (entity.titles[0] && entity.titles[0].text) return entity.titles[0].text
      }
      if (isCategory(entity))
        return t('unnamedCategory')
      else if (isPhenotype(entity))
        return t('unnamedPhenotype')

      return t('unnamedRestriction')
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

    /**
     * Returns a Boolean, indicating if the provided entity is restricted.
     * @param entity the entity
     * @returns true if entity is restricted
     */
    isRestricted (this: void, entity: Entity): entity is Phenotype {
      return [EntityType.CombinedRestriction, EntityType.SingleRestriction, EntityType.DerivedRestriction].includes(entity.entityType)
    },

    hasExpression (this: void, entity: Entity): entity is Phenotype {
      return entity.entityType === EntityType.CombinedRestriction || entity.entityType === EntityType.DerivedPhenotype
    },

    restrictionEntityTypes (this: void): EntityType[] {
      return [
        EntityType.CombinedRestriction,
        EntityType.DerivedRestriction,
        EntityType.SingleRestriction
      ]
    }
  }
}
