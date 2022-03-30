import { BooleanRestriction, Category, DateTimeRestriction, Entity, EntityApi, EntityType, ExpressionOperator, ExpressionOperatorApi, NumberRestriction, Phenotype, StringRestriction } from '@onto-med/top-api'
import { AxiosResponse } from 'axios'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

const entityApi = new EntityApi()
const expressionOperatorApi = new ExpressionOperatorApi()

export const useEntity = defineStore('entity', {
  state: () => {
    return {
      organisationId: undefined as string|undefined,
      repositoryId: undefined as string|undefined,
      entities: [] as Entity[],
      operators: new Map<string, ExpressionOperator[]>()
    }
  },
  actions: {
    async reloadEntities () {
      if (!this.organisationId || !this.repositoryId)
        throw {
          name: 'MissingParametersException',
          message: 'organisationId or repositoryId missing'
        }
      await entityApi.getEntitiesByRepositoryId(this.organisationId, this.repositoryId)
        .then((r) => this.entities = r.data)
    },

    async reloadOperatorsByType (type: string) {
      await expressionOperatorApi?.getExpressionOperators(type)
        .then((r) => this.operators.set(type, r.data))
    },

    async reloadOperators () {
      await this.reloadOperatorsByType('math')
      await this.reloadOperatorsByType('boolean')
    },

    getOperators (type: string): ExpressionOperator[] {
      return this.operators.get(type) || []
    },

    getEntity (id: string|undefined): Entity|undefined {
      return this.entities.find(e => e.id === id)
    },

    addEntity (entityType: EntityType, superClassId: string): Entity {
      const entity = { id: (uuidv4 as () => string)(), entityType: entityType } as Entity

      const superClass = this.getEntity(superClassId)
      if (superClass && [ EntityType.SinglePhenotype, EntityType.DerivedPhenotype ].includes(superClass.entityType)) {
        (entity as Phenotype).dataType = (superClass as Phenotype).dataType
        if (this.hasRestriction(entity))
          entity.restriction = { type: entity.dataType } as NumberRestriction|StringRestriction|BooleanRestriction|DateTimeRestriction
      }

      if (superClass) {
        const short = { id: superClass.id, entityType: superClass.entityType } as Entity
        if (this.isPhenotype(superClass)) {
          (entity as Phenotype).superPhenotype = short
        } else {
          (entity as Category).superCategories = [ short ]
        }
      }
      this.entities.push(entity)

      return entity
    },

    forkEntity (entity: Entity) {
      alert('not implemented!')
      // TODO: check if entity has already been forked in current repository
      // TODO: perform fork request
      // TODO: add entity to entities array
      this.entities.push(entity)
      // TODO: there mey be additional entities that must be pushed to the tree (e.g. referenced entities in expressions or subclasses)
    },

    async saveEntity (entity: Entity) {
      if (!entity || !entityApi || !this.organisationId || !this.repositoryId)
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing'
        }

      let promise: Promise<AxiosResponse<Entity>>
      if (!entity.createdAt) {
        promise = entityApi.createEntity(this.organisationId, this.repositoryId, entity)
      } else {
        promise = entityApi.updateEntityById(this.organisationId, this.repositoryId, entity.id as string, entity)
      }

      return promise
        .then((r) => {
          const existing = this.getEntity(r.data.id)
          if (existing)
            return Object.assign(existing, r.data)
          else {
            this.entities.push(r.data)
            return this.getEntity(r.data.id) as Entity
          }
        })
    },

    async deleteEntity (entity: Entity) {
      const index = this.entities.findIndex(e => e.id === entity.id)
      if (index === -1) return

      if (entity.version) {
        if (!this.organisationId || !this.repositoryId || !entity.id)
          throw {
            name: 'MissingAttributesException',
            message: 'attributesMissing'
          }
        await entityApi.deleteEntityById(this.organisationId, this.repositoryId, entity.id)
          .then(() => this.entities.splice(index, 1))
      } else {
        this.entities.splice(index, 1)
      }

      if (this.isCategory(entity)) {
        this.entities.filter((e: Category|Phenotype) => this.hasSuperCategory(e, entity)).forEach((e: Category|Phenotype) => {
          e.superCategories = e.superCategories?.filter(c => c.id !== entity.id)
          if (entity.superCategories) e.superCategories?.push(...(entity.superCategories))
        })
      } else if (this.isPhenotype(entity)) {
        this.entities = this.entities.filter((p: Phenotype) => p.superPhenotype?.id !== entity.id)
      }
    },

    async deleteVersion (entity: Entity) {
      if (!entity || !entityApi || !this.organisationId || !this.repositoryId)
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing'
        }

      await entityApi.deleteEntityById(this.organisationId, this.repositoryId, entity.id as string, entity.version as number, undefined, undefined)
    },

    async restoreVersion (entity: Entity) {
      if (!entity || !entityApi || !this.organisationId || !this.repositoryId)
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing'
        }

      await entityApi.setCurrentEntityVersion(this.organisationId, this.repositoryId, entity.id as string, entity.version as number, undefined, undefined)
        .then(() => Object.assign(this.entities.find(e => e.id == entity.id), entity))
    },

    hasSuperCategory (entity: Category|Phenotype, category: Category): boolean {
      return entity.superCategories?.findIndex(c => c.id === category.id) !== -1
    },

    isCategory (entity: Entity): entity is Category {
      return EntityType.Category === entity.entityType
    },

    isPhenotype (entity: Entity): entity is Phenotype {
      return [EntityType.SinglePhenotype, EntityType.CombinedPhenotype, EntityType.DerivedPhenotype].includes(entity.entityType)
    },

    hasRestriction (entity: Entity): entity is Phenotype {
      return [EntityType.SingleRestriction, EntityType.DerivedRestriction].includes(entity.entityType)
    }
  }
})
