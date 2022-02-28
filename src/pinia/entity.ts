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
    }
  }
})
