// Do not remove this import. If you do Vite will think your styles are dead
// code and not include them in the build output.
import { DatabaseUpdateOperation } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/_types.mjs'
import '../styles/style.scss'
import ExperienceCounter from './apps/experienceCounter'
import { moduleId } from './constants'
import { MyModule } from './types'

export interface Changed {
  system: Record<string, any>
}

let module: MyModule

Hooks.once('init', () => {
  console.log(`Initializing ${moduleId}`)
  module = (game as Game).modules.get(moduleId) as unknown as MyModule
  module.experienceCounter = new ExperienceCounter()
})

Hooks.on(
  'updateItem',
  (
    item: Item,
    changed: Changed,
    options: DatabaseUpdateOperation,
    userId: string
  ) => {
    console.log('item', item)
    console.log('changed', changed)
    console.log('options', options)
    console.log('userId', userId)
  }
)

Hooks.on('updateActor', (actor: Actor, changed: Changed) => {
  module.experienceCounter.maybeAddExperienceCost(changed, actor)
})

Hooks.on(
  'preUpdateActor',
  (
    actor: Actor
    // changed: Changed,
    // options: DatabaseUpdateOperation,
    // userId: string
  ) => {
    module.experienceCounter.storeActor(actor)
  }
)
