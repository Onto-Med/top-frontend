import {
  BooleanRestriction,
  Category,
  CodeApi,
  CodeSystemPage,
  Concept,
  Constant,
  Converter,
  DataSource,
  DataType,
  DateTimeRestriction,
  DefaultApi,
  Entity,
  EntityApi,
  EntityDeleteOptions,
  EntityType,
  ExpressionFunction,
  ForkingInstruction,
  NumberRestriction,
  Organisation,
  OrganisationApi,
  Phenotype,
  Quantifier,
  QueryApi,
  QueryType,
  Repository,
  RepositoryApi,
  Role,
  SingleConcept,
  StringRestriction,
  User,
  UserApi,
} from '@onto-med/top-api'
import { AxiosResponse } from 'axios'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { ForkResult } from 'src/components/models'
import Keycloak from 'keycloak-js'

export const useEntityStore = defineStore('entity', {
  state: () => {
    return {
      organisationId: undefined as string | undefined,
      repositoryId: undefined as string | undefined,
      organisation: undefined as Organisation | undefined,
      repository: undefined as Repository | undefined,
      entities: [] as Entity[],
      dataSources: undefined as Map<QueryType, DataSource[]> | undefined,
      constants: undefined as Constant[] | undefined,
      functions: undefined as ExpressionFunction[] | undefined,
      converters: undefined as Converter[] | undefined,
      keycloak: undefined as Keycloak | undefined,
      entityApi: undefined as EntityApi | undefined,
      organisationApi: undefined as OrganisationApi | undefined,
      repositoryApi: undefined as RepositoryApi | undefined,
      defaultApi: undefined as DefaultApi | undefined,
      queryApi: undefined as QueryApi | undefined,
      codeApi: undefined as CodeApi | undefined,
      userApi: undefined as UserApi | undefined,
      user: undefined as User | undefined,
    }
  },
  getters: {
    isAuthenticated(state) {
      return !state.keycloak || state.keycloak.authenticated
    },

    isAdmin(state) {
      return state.user?.role === Role.Admin
    },
  },
  actions: {
    async loadUser() {
      if (!this.user?.id) {
        if (this.keycloak) {
          if (this.keycloak.authenticated && this.keycloak.subject) {
            await this.userApi
              ?.getUserById(this.keycloak.subject)
              .then((r) => (this.user = r.data))
              .catch(() => {})
          } else {
            this.user = { role: Role.User } as User
          }
        } else {
          this.user = { role: Role.Admin } as User
        }
      }
    },

    async reloadEntities() {
      if (!this.organisationId || !this.repositoryId)
        throw {
          name: 'MissingParametersException',
          message: 'organisationId or repositoryId missing',
        } as Error
      const organisationId = this.organisationId
      const repositoryId = this.repositoryId

      await this.entityApi
        ?.getRootEntitiesByRepositoryId(organisationId, repositoryId)
        .then((r) => {
          if (organisationId === this.organisationId && repositoryId === this.repositoryId)
            this.entities = r.data
        })
    },

    async reloadDataSources() {
      this.dataSources = new Map<QueryType, DataSource[]>()
      for (const qType of [QueryType.Concept, QueryType.Phenotype]) {
        await this.queryApi?.getDataSources(qType).then((r) => this.dataSources?.set(qType, r.data))
      }
    },

    async reloadConstants() {
      await this.entityApi?.getExpressionConstants().then((r) => (this.constants = r.data))
    },

    async reloadFunctions() {
      await this.entityApi?.getExpressionFunctions().then((r) => {
        this.functions = [
          {
            id: 'Entity',
            title: 'entity',
            type: 'component',
            minArgumentNumber: 1,
            maxArgumentNumber: 1,
          } as ExpressionFunction,
          {
            id: 'Constant',
            title: 'constant',
            type: 'component',
            minArgumentNumber: 1,
            maxArgumentNumber: 1,
          } as ExpressionFunction,
        ].concat(r.data)
      })
    },

    async getFunction(type: string, ...id: string[]): Promise<ExpressionFunction[]> {
      if (!this.functions) await this.reloadFunctions()
      return this.functions?.filter((f) => f.type === type && id.includes(f.id)) || []
    },

    async setOrganisationById(organisationId: string | undefined) {
      if (this.organisationId !== organisationId) {
        this.entities = []
        this.organisationId = organisationId
        this.organisation = undefined
        this.repositoryId = undefined
        this.repository = undefined
      }
      if (!organisationId || this.organisation) return
      await this.organisationApi?.getOrganisationById(organisationId).then((r) => {
        if (organisationId === this.organisationId) this.organisation = r.data
      })
    },

    async setRepository(repository?: Repository) {
      await this.setOrganisationById(repository?.organisation?.id).then(() =>
        this.setRepositoryById(repository?.id),
      )
    },

    async setRepositoryById(repositoryId: string | undefined) {
      if (this.repositoryId !== repositoryId) {
        this.entities = []
        this.repositoryId = repositoryId
        this.repository = undefined
      }
      if (!repositoryId || this.repository) return
      const organisationId = this.organisationId
      if (!organisationId) return
      await this.repositoryApi
        ?.getRepositoryById(organisationId, repositoryId, undefined)
        .then((r) => {
          if (organisationId === this.organisationId && repositoryId === this.repositoryId)
            this.repository = r.data
        })
    },

    async getDataSources(queryType: QueryType): Promise<DataSource[]> {
      if (!this.dataSources) await this.reloadDataSources()
      return this.dataSources?.get(queryType) || []
    },

    async getConstants(): Promise<Constant[]> {
      if (!this.constants) await this.reloadConstants()
      return this.constants || []
    },

    getEntity(id: string | undefined): Entity | undefined {
      if (!id) return undefined
      return this.entities.find((e) => e.id === id)
    },

    async loadEntity(id: string | undefined, ignoreLocal = false): Promise<Entity | undefined> {
      return Promise.resolve()
        .then(() => {
          if (!ignoreLocal) {
            const entity = this.getEntity(id)
            if (entity) return entity
          }
        })
        .then(async (e) => {
          if (e || !id || !this.entityApi || !this.organisationId || !this.repositoryId)
            return Promise.resolve(e)
          return this.entityApi
            .getEntityById(this.organisationId, this.repositoryId, id)
            .then((r) => {
              if (
                r.data !== undefined &&
                r.data.repository?.organisation?.id === this.organisationId &&
                r.data.repository?.id === this.repositoryId
              ) {
                this.addOrReplaceEntity(r.data)
              }
              return r.data
            })
        })
        .then((e) => {
          const superPhenotype = (e as Phenotype).superPhenotype
          const categories = (e as Category).superCategories
          const concepts = (e as Concept).superConcepts
          if (superPhenotype && superPhenotype.id) {
            if (this.getEntity(superPhenotype.id)) return Promise.resolve(e)
            return this.loadEntity(superPhenotype.id, ignoreLocal).then(() => e)
          } else if (categories) {
            return Promise.all(
              categories.map((c) => {
                if (!c || !c.id || this.getEntity(c.id)) return Promise.resolve(e)
                return this.loadEntity(c.id, ignoreLocal)
              }),
            ).then(() => e)
          } else if (concepts) {
            return Promise.all(
              concepts.map((c) => {
                if (!c || !c.id || this.getEntity(c.id)) return Promise.resolve(e)
                return this.loadEntity(c.id, ignoreLocal)
              }),
            ).then(() => e)
          }
          return e
        })
    },

    addEntity(entityType: EntityType, superClassId: string): Entity {
      const entity = { id: (uuidv4 as () => string)(), entityType: entityType } as Entity

      const superClass = this.getEntity(superClassId)
      if (
        superClass &&
        [EntityType.CompositePhenotype, EntityType.SinglePhenotype].includes(superClass.entityType)
      ) {
        ;(entity as Phenotype).dataType = DataType.Boolean
        if (this.hasRestriction(entity))
          entity.restriction = {
            type: (superClass as Phenotype).dataType,
            quantifier: Quantifier.Min,
            cardinality: 1,
          } as NumberRestriction | StringRestriction | BooleanRestriction | DateTimeRestriction
      }

      if (superClass) {
        const short = {
          id: superClass.id,
          entityType: superClass.entityType,
          titles: superClass.titles,
        } as Entity
        if (this.isPhenotype(superClass)) {
          ;(entity as Phenotype).superPhenotype = short
        } else if (this.isConcept(superClass)) {
          ;(entity as Concept).superConcepts = [short]
        } else {
          ;(entity as Category).superCategories = [short]
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

    async forkEntity(entity: Entity, forkingInstruction: ForkingInstruction): Promise<ForkResult> {
      if (!this.entityApi || !entity.id || !entity.repository || !entity.repository.organisation)
        return { count: 0 }

      const organisationId = this.organisationId
      const repositoryId = this.repositoryId

      return this.entityApi
        .createFork(
          entity.repository.organisation.id,
          entity.repository.id,
          entity.id,
          {
            ...forkingInstruction,
            organisationId: organisationId,
            repositoryId: repositoryId,
          } as ForkingInstruction,
          undefined,
          undefined,
        )
        .then((r) => {
          if (organisationId === this.organisationId && repositoryId === this.repositoryId) {
            r.data.forEach((e) => this.addOrReplaceEntity(e))
            return {
              count: r.data.length,
              entity: r.data.filter((e) =>
                e.equivalentEntities?.find((eq) => eq.id === entity.id),
              )[0],
            } as ForkResult
          }
          return { count: 0 }
        })
    },

    addOrReplaceEntity(entity: Entity): void {
      const index = this.entities.findIndex((e) => e.id === entity.id)
      if (index !== -1) this.entities.splice(index, 1)
      this.entities.push(entity)
    },

    async saveEntity(entity: Entity) {
      const organisationId = this.organisationId
      const repositoryId = this.repositoryId

      if (!entity || !this.entityApi || !organisationId || !repositoryId)
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing',
        } as Error

      let promise: Promise<AxiosResponse<Entity>>
      if (!entity.createdAt) {
        promise = this.entityApi.createEntity(organisationId, repositoryId, entity)
      } else {
        promise = this.entityApi.updateEntityById(
          organisationId,
          repositoryId,
          entity.id as string,
          entity,
        )
      }

      return promise.then((r) => {
        if (organisationId !== this.organisationId || repositoryId !== this.repositoryId)
          throw new Error('Entity saved, but repository has been changed in the meantime.')
        return this.pushOrReplaceEntity(r.data) as Entity
      })
    },

    pushOrReplaceEntity(entity: Entity) {
      if (!entity || !entity.id) return undefined
      const index = this.entities.findIndex((e) => e.id === entity.id)
      if (index !== -1) {
        this.entities[index] = entity
      } else {
        this.entities.push(entity)
      }
      return this.getEntity(entity.id)
    },

    async deleteEntity(entity: Entity, cascade?: boolean) {
      const index = this.entities.findIndex((e) => e.id === entity.id)
      if (index === -1) return

      if (entity.version) {
        const organisationId = this.organisationId
        const repositoryId = this.repositoryId
        if (!organisationId || !repositoryId || !entity.id)
          throw {
            name: 'MissingAttributesException',
            message: 'attributesMissing',
          } as Error

        const deleteOptions = { cascade: cascade || false } as EntityDeleteOptions
        await this.entityApi
          ?.deleteEntityById(
            organisationId,
            repositoryId,
            entity.id,
            undefined,
            undefined,
            deleteOptions,
          )
          .then(() => {
            if (organisationId === this.organisationId && repositoryId === this.repositoryId)
              this.entities.splice(index, 1)
          })
      } else {
        this.entities.splice(index, 1)
      }

      if (this.isCategory(entity)) {
        this.entities
          .filter((e: Category | Phenotype) => this.hasSuperCategory(e, entity))
          .forEach((e: Category | Phenotype) => {
            e.superCategories = e.superCategories?.filter((c) => c.id !== entity.id)
            if (entity.superCategories) e.superCategories?.push(...entity.superCategories)
          })
      } else if (this.isPhenotype(entity)) {
        this.entities = this.entities.filter((p: Phenotype) => p.superPhenotype?.id !== entity.id)
      } else if (this.isConcept(entity)) {
        this.entities
          .filter((e: Concept) => this.hasSuperConcept(e, entity))
          .forEach((e: Concept) => {
            e.superConcepts = e.superConcepts?.filter((c) => c.id !== entity.id)
            if (entity.superConcepts) e.superConcepts?.push(...entity.superConcepts)
          })
      }
    },

    async deleteVersion(entity: Entity) {
      if (
        !entity ||
        !entity.id ||
        !entity.version ||
        !this.entityApi ||
        !this.organisationId ||
        !this.repositoryId
      )
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing',
        } as Error

      await this.entityApi.deleteEntityById(
        this.organisationId,
        this.repositoryId,
        entity.id,
        entity.version,
        undefined,
        undefined,
      )
    },

    async restoreVersion(entity: Entity) {
      if (
        !entity ||
        !entity.id ||
        !entity.version ||
        !this.entityApi ||
        !this.organisationId ||
        !this.repositoryId
      )
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing',
        } as Error

      await this.entityApi
        .setCurrentEntityVersion(
          this.organisationId,
          this.repositoryId,
          entity.id,
          entity.version,
          undefined,
          undefined,
        )
        .then(() => this.pushOrReplaceEntity(entity))
    },

    async loadChildren(entity: Entity): Promise<Entity[]> {
      if (!entity || !entity.id || !this.entityApi || !this.organisationId || !this.repositoryId)
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing',
        } as Error

      return await this.entityApi
        .getSubclassesById(this.organisationId, this.repositoryId, entity.id)
        .then((r) => {
          r.data.forEach((e) => this.addOrReplaceEntity(e))
          return r.data
        })
    },

    async moveEntity(entity: Entity, superEntities: Entity[]) {
      if (!this.entityApi || !this.organisationId || !this.repositoryId || !entity.id)
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing',
        } as Error

      await this.entityApi
        .moveEntity(
          this.organisationId,
          this.repositoryId,
          entity.id,
          superEntities.filter((e) => !!e),
        )
        .then((r) => this.pushOrReplaceEntity(r.data))
    },

    hasSuperCategory(entity: Category | Phenotype, category: Category): boolean {
      return entity.superCategories?.findIndex((c) => c.id === category.id) !== -1
    },

    hasSuperConcept(entity: Concept, concept: SingleConcept): boolean {
      return entity.superConcepts?.findIndex((c) => c.id === concept.id) !== -1
    },

    isCategory(entity: Entity): entity is Category {
      return EntityType.Category === entity.entityType
    },

    isConcept(entity: Entity): entity is Concept {
      return [EntityType.SingleConcept, EntityType.CompositeConcept].includes(entity.entityType)
    },

    isPhenotype(entity: Entity): entity is Phenotype {
      return [EntityType.SinglePhenotype, EntityType.CompositePhenotype].includes(entity.entityType)
    },

    isRestricted(entity: Entity): entity is Phenotype {
      return [EntityType.SingleRestriction, EntityType.CompositeRestriction].includes(
        entity.entityType,
      )
    },

    hasRestriction(entity: Entity): entity is Phenotype {
      return [EntityType.SingleRestriction, EntityType.CompositeRestriction].includes(
        entity.entityType,
      )
    },

    async loadSuperPhenotype(phenotype: Phenotype | string): Promise<Phenotype | undefined> {
      const entityId = Object.prototype.hasOwnProperty.call(phenotype, 'id')
        ? (phenotype as Phenotype).id
        : (phenotype as string)
      return this.loadEntity(entityId).then((restriction) => {
        if (!restriction || !this.isRestricted(restriction) || !restriction.superPhenotype)
          return Promise.resolve(undefined)
        return this.loadEntity(restriction.superPhenotype.id)
      })
    },

    async loadConverters() {
      if (!this.converters) this.converters = (await this.entityApi?.getConverters())?.data
    },

    async getCodeSystems(name?: string, page = 1): Promise<CodeSystemPage> {
      if (!this.codeApi)
        throw {
          name: 'MissingAttributesException',
          message: 'attributesMissing',
        } as Error
      return await this.codeApi.getCodeSystems(undefined, undefined, name, page).then((r) => r.data)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEntityStore, import.meta.hot))
}
