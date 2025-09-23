import { ApplicationConfig } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'

import { routes } from './app.routes'
import { RelationApi } from './api/relation'
import { RelationRepository } from './repository/relation-repository'
import { RepoRegistryService } from './services/repo-registry.service'
import { REPO_HANDLER_PROVIDERS, CONTEXT_SETTER_PROVIDERS } from './repo-handlers'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    RelationApi,
    RepoRegistryService,
    ...CONTEXT_SETTER_PROVIDERS,
    ...REPO_HANDLER_PROVIDERS,
  ],
}
