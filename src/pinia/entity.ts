import { KeycloakInstance } from '@dsb-norge/vue-keycloak-js/dist/types'
import { BooleanRestriction, Category, DateTimeRestriction, Entity, EntityApi, EntityType, ExpressionFunction, ExpressionFunctionApi, ForkApi, NumberRestriction, Phenotype, StringRestriction, RepositoryApi, Repository, Organisation, OrganisationApi, ExpressionConstantApi, Constant, ForkingInstruction, DataSource, DataSourceApi, Quantifier, DefaultApi, Converter, CodeApi, Code, CodeSystem } from '@onto-med/top-api'
import { AxiosResponse } from 'axios'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

export const useEntity = defineStore('entity', {
  state: () => {
    return {
      organisationId: undefined as string | undefined,
      repositoryId: undefined as string | undefined,
      organisation: undefined as Organisation | undefined,
      repository: undefined as Repository | undefined,
      entities: [] as Entity[],
      dataSources: undefined as DataSource[] | undefined,
      constants: undefined as Constant[] | undefined,
      functions: undefined as ExpressionFunction[] | undefined,
      converters: undefined as Converter[] | undefined,
      keycloak: undefined as KeycloakInstance | undefined,
      entityApi: undefined as EntityApi | undefined,
      expressionConstantApi: undefined as ExpressionConstantApi | undefined,
      expressionFunctionApi: undefined as ExpressionFunctionApi | undefined,
      organisationApi: undefined as OrganisationApi | undefined,
      repositoryApi: undefined as RepositoryApi | undefined,
      forkApi: undefined as ForkApi | undefined,
      dataSourceApi: undefined as DataSourceApi | undefined,
      defaultApi: undefined as DefaultApi | undefined,
      codeApi: undefined as CodeApi | undefined,
      codeSystems: undefined as CodeSystem[] | undefined
    }
  },
  actions: {
    async reloadEntities() {
      if (!this.organisationId || !this.repositoryId)
        throw {
          name: 'MissingParametersException',
          message: 'organisationId or repositoryId missing'
        }
      const organisationId = this.organisationId
      const repositoryId = this.repositoryId

      await this.entityApi?.getRootEntitiesByRepositoryId(organisationId, repositoryId)
        .then((r) => {
          if (organisationId === this.organisationId && repositoryId === this.repositoryId)
            this.entities = r.data
        })
    },

    async reloadDataSources() {
      await this.dataSourceApi?.getDataSources()
        .then(r => this.dataSources = r.data)
    },

    async reloadConstants() {
      await this.expressionConstantApi?.getExpressionConstants()
        .then(r => this.constants = r.data)
    },

    async reloadFunctions() {
      await this.expressionFunctionApi?.getExpressionFunctions()
        .then(r => {
          this.functions = [
            {
              id: 'Entity',
              title: 'entity',
              type: 'component',
              minArgumentNumber: 1,
              maxArgumentNumber: 1
            } as ExpressionFunction,
            {
              id: 'Constant',
              title: 'constant',
              type: 'component',
              minArgumentNumber: 1,
              maxArgumentNumber: 1
            } as ExpressionFunction
          ].concat(r.data)
        })
    },

    async getFunction(type: string, ...id: string[]): Promise<ExpressionFunction[]> {
      if (!this.functions)
        await this.reloadFunctions()
      return this.functions?.filter(f => f.type === type && id.includes(f.id)) || []
    },

    async setOrganisation(organisationId: string | undefined) {
      if (this.organisationId !== organisationId) {
        this.entities = []
        this.organisationId = organisationId
        this.organisation = undefined
        this.repositoryId = undefined
        this.repository = undefined
      }
      if (!organisationId || this.organisation) return
      await this.organisationApi?.getOrganisationById(organisationId)
        .then(r => {
          if (organisationId === this.organisationId)
            this.organisation = r.data
        })
    },

    async setRepository(repositoryId: string | undefined) {
      if (this.repositoryId !== repositoryId) {
        this.entities = []
        this.repositoryId = repositoryId
        this.repository = undefined
      }
      if (!repositoryId || this.repository) return
      const organisationId = this.organisationId
      if (!organisationId) return
      await this.repositoryApi?.getRepositoryById(organisationId, repositoryId, undefined)
        .then(r => {
          if (organisationId === this.organisationId && repositoryId === this.repositoryId)
            this.repository = r.data
        })
    },

    async getDataSources(): Promise<DataSource[]> {
      if (!this.dataSources)
        await this.reloadDataSources()
      return this.dataSources || []
    },

    async getConstants(): Promise<Constant[]> {
      if (!this.constants)
        await this.reloadConstants()
      return this.constants || []
    },

    getEntity(id: string | undefined): Entity | undefined {
      if (!id) return undefined
      return this.entities.find(e => e.id === id)
    },

    loadEntity(id: string | undefined, ignorelocal = false): Promise<Entity | undefined> {
      return Promise.resolve()
        .then(() => {
          if (!ignorelocal) {
            const entity = this.getEntity(id)
            if (entity) return entity
          }
        })
        .then((e) => {
          if (e || !id || !this.entityApi || !this.organisationId || !this.repositoryId)
            return Promise.resolve(e)
          return this.entityApi
            .getEntityById(this.organisationId, this.repositoryId, id)
            .then(r => {
              this.addOrReplaceEntity(r.data)
              return r.data
            })
        })
        .then((e) => {
          const superPhenotype = (e as Phenotype).superPhenotype
          const categories = (e as Category).superCategories
          if (superPhenotype && superPhenotype.id) {
            if (this.getEntity(superPhenotype.id)) return Promise.resolve(e)
            return this.loadEntity(superPhenotype.id, ignorelocal).then(() => e)
          } else if (categories) {
            return Promise.all(categories.map(c => {
              if (!c || !c.id || this.getEntity(c.id)) return Promise.resolve(e)
              return this.loadEntity(c.id, ignorelocal)
            })).then(() => e)
          }
          return e
        })
    },

    addEntity(entityType: EntityType, superClassId: string): Entity {
      const entity = { id: (uuidv4 as () => string)(), entityType: entityType } as Entity

      const superClass = this.getEntity(superClassId)
      if (superClass && [EntityType.CompositePhenotype, EntityType.SinglePhenotype].includes(superClass.entityType)) {
        (entity as Phenotype).dataType = (superClass as Phenotype).dataType
        if (this.hasRestriction(entity))
          entity.restriction = {
            type: entity.dataType,
            quantifier: Quantifier.Min,
            cardinality: 1
          } as NumberRestriction | StringRestriction | BooleanRestriction | DateTimeRestriction
      }

      if (superClass) {
        const short = {
          id: superClass.id,
          entityType: superClass.entityType,
          titles: superClass.titles
        } as Entity
        if (this.isPhenotype(superClass)) {
          (entity as Phenotype).superPhenotype = short
        } else {
          (entity as Category).superCategories = [short]
        }
      }

      this.entities.push(entity)

      return entity
    },

    addDuplicate(entity: Entity): Entity {
      const duplicate = JSON.parse(JSON.stringify(entity)) as Entity
      duplicate.id = (uuidv4 as () => string)()
      duplicate.version = undefined
      duplicate.createdAt = undefined
      duplicate.author = undefined
      this.entities.push(duplicate)
      return duplicate
    },

    async forkEntity(entity: Entity, forkingInstruction: ForkingInstruction): Promise<number> {
      if (!this.forkApi || !entity.id || !entity.repository || !entity.repository.organisation) return 0

      const organisationId = this.organisationId
      const repositoryId = this.repositoryId

      return this.forkApi.createFork(
        entity.repository.organisation.id,
        entity.repository.id,
        entity.id,
        {
          ...forkingInstruction,
          organisationId: organisationId,
          repositoryId: repositoryId
        } as ForkingInstruction,
        undefined,
        undefined
      ).then(r => {
        if (organisationId === this.organisationId && repositoryId === this.repositoryId) {
          r.data.forEach(e => this.addOrReplaceEntity(e))
          return r.data.length
        }
        return 0
      })
    },

    addOrReplaceEntity(entity: Entity): void {
      const index = this.entities.findIndex(e => e.id === entity.id)
      if (index !== -1) this.entities.splice(index, 1)
      this.entities.push(entity)
    },

    async saveEntity(entity: Entity) {
      const organisationId = this.organisationId
      const repositoryId = this.repositoryId

      if (!entity || !this.entityApi || !organisationId || !repositoryId)
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing'
        }

      let promise: Promise<AxiosResponse<Entity>>
      if (!entity.createdAt) {
        promise = this.entityApi.createEntity(organisationId, repositoryId, entity)
      } else {
        promise = this.entityApi.updateEntityById(organisationId, repositoryId, entity.id as string, entity)
      }

      return promise
        .then((r) => {
          if (organisationId !== this.organisationId || repositoryId !== this.repositoryId)
            throw new Error('Entity saved, but repository has been changed in the meantime.')
          const existing = this.getEntity(r.data.id)
          if (existing)
            return Object.assign(existing, r.data)
          else {
            this.entities.push(r.data)
            return this.getEntity(r.data.id) as Entity
          }
        })
    },

    async deleteEntity(entity: Entity) {
      const index = this.entities.findIndex(e => e.id === entity.id)
      if (index === -1) return

      if (entity.version) {
        const organisationId = this.organisationId
        const repositoryId = this.repositoryId
        if (!organisationId || !repositoryId || !entity.id)
          throw {
            name: 'MissingAttributesException',
            message: 'attributesMissing'
          }
        await this.entityApi?.deleteEntityById(organisationId, repositoryId, entity.id)
          .then(() => {
            if (organisationId === this.organisationId && repositoryId === this.repositoryId)
              this.entities.splice(index, 1)
          })
      } else {
        this.entities.splice(index, 1)
      }

      if (this.isCategory(entity)) {
        this.entities.filter((e: Category | Phenotype) => this.hasSuperCategory(e, entity)).forEach((e: Category | Phenotype) => {
          e.superCategories = e.superCategories?.filter(c => c.id !== entity.id)
          if (entity.superCategories) e.superCategories?.push(...(entity.superCategories))
        })
      } else if (this.isPhenotype(entity)) {
        this.entities = this.entities.filter((p: Phenotype) => p.superPhenotype?.id !== entity.id)
      }
    },

    async deleteVersion(entity: Entity) {
      if (!entity || !entity.id || !entity.version || !this.entityApi || !this.organisationId || !this.repositoryId)
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing'
        }

      await this.entityApi.deleteEntityById(this.organisationId, this.repositoryId, entity.id, entity.version, undefined, undefined)
    },

    async restoreVersion(entity: Entity) {
      if (!entity || !entity.id || !entity.version || !this.entityApi || !this.organisationId || !this.repositoryId)
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing'
        }

      await this.entityApi.setCurrentEntityVersion(this.organisationId, this.repositoryId, entity.id, entity.version, undefined, undefined)
        .then(() => {
          const old = this.entities.find(e => e.id == entity.id)
          if (old) Object.assign(old, entity)
        })
    },

    async loadChildren(entity: Entity): Promise<Entity[]> {
      if (!entity || !entity.id || !this.entityApi || !this.organisationId || !this.repositoryId)
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing'
        }

      return await this.entityApi.getSubclassesById(this.organisationId, this.repositoryId, entity.id)
        .then((r) => {
          r.data.forEach(e => this.addOrReplaceEntity(e))
          return r.data
        })
    },

    hasSuperCategory(entity: Category | Phenotype, category: Category): boolean {
      return entity.superCategories?.findIndex(c => c.id === category.id) !== -1
    },

    isCategory(entity: Entity): entity is Category {
      return EntityType.Category === entity.entityType
    },

    isPhenotype(entity: Entity): entity is Phenotype {
      return [EntityType.SinglePhenotype, EntityType.CompositePhenotype].includes(entity.entityType)
    },

    isRestricted(entity: Entity): entity is Phenotype {
      return [EntityType.SingleRestriction, EntityType.CompositeRestriction].includes(entity.entityType)
    },

    hasRestriction(entity: Entity): entity is Phenotype {
      return [EntityType.SingleRestriction, EntityType.CompositeRestriction].includes(entity.entityType)
    },

    async loadSuperPhenotype(phenotype: Phenotype | string): Promise<Phenotype | undefined> {
      const entityId = phenotype.hasOwnProperty('id') ? (phenotype as Phenotype).id : phenotype as string
      return this.loadEntity(entityId)
        .then(restriction => {
          if (!restriction || !this.isRestricted(restriction) || !restriction.superPhenotype) return Promise.resolve(undefined)
          return this.loadEntity(restriction.superPhenotype.id)
        })
    },

    async loadConverters() {
      if (!this.converters)
        this.converters = (await this.defaultApi?.getConverters())?.data
    },

    async getCodeSystems(): Promise<CodeSystem[] | undefined> {
      if (!this.codeSystems)
        this.codeSystems = (await this.codeApi?.getCodeSystems(undefined, undefined, undefined, 0))?.data
      return this.codeSystems
    }
  }
})
