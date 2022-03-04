import { Entity, EntityApi } from '@onto-med/top-api'
import { defineStore } from 'pinia'

const entityApi = new EntityApi()

export const useEntity = defineStore('entity', {
  state: () => {
    return {
      entities: [] as Entity[]
    }
  },
  actions: {
    async reloadEntities (organisationId: string, repositoryId: string) {
      if (!organisationId || !repositoryId)
        throw {
          name: 'MissingParametersException',
          message: 'organisationId or repositoryId missing'
        }
      await entityApi.getRootEntitiesByRepositoryId(organisationId, repositoryId)
        .then((r) => this.entities = r.data)
    },

    addEntity (entity: Entity) {
      this.entities.push(entity)
    },

    async deleteEntity (entity: Entity) {
      const index = this.entities.findIndex(e => e.id === entity.id)
      if (index === -1) return

      if (entity.version) {
        if (!entity.repository || !entity.repository.organisation || !entity.id)
          throw {
            name: 'MissingAttributesException',
            message: 'attributesMissing'
          }
        await entityApi.deleteEntityById(entity.repository.organisation.id, entity.repository?.id, entity.id)
          .then(() => this.entities.splice(index, 1))
      } else {
        this.entities.splice(index, 1)
      }
    }
  }
})
