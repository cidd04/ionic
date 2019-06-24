import { createIonicRegistry } from './ionicRegistry'

/** Aggregates all registries supported by the library */

export const registries = {
  ionic: {
    create: createIonicRegistry,
  },
}
