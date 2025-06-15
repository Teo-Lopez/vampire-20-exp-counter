// Do not remove this import. If you do Vite will think your styles are dead
// code and not include them in the build output.

import '../styles/style.scss'
import ExperienceCounter from './apps/experienceCounter'
import { moduleId } from './constants'
import { MyModule } from './types'

export interface Changed {
  system: Record<string, any>
  _id: string
}

let module: MyModule

Hooks.once('init', () => {
  module = (game as Game).modules.get(moduleId) as unknown as MyModule
  module.experienceCounter = new ExperienceCounter()
})

Hooks.on('renderActorSheet', (app: ActorSheet, html: JQuery<HTMLElement>) => {
  const actor = app.actor

  const checkbox = $(`
    <div class="form-group">
      <label>Deshabilitar registro automático de exp</label>
      <input type="checkbox" name="flags.experienceCounter.disabled" ${
        getProperty(actor, 'flags.experienceCounter.disabled') ? 'checked' : ''
      }/>
    </div>
  `)

  html.find('.note').prepend(checkbox)
})

const isCounterEnabled = (actor: Actor) => {
  return !getProperty(actor, 'flags.experienceCounter.disabled')
}

Hooks.on('updateItem', (item: Item, changed: Changed) => {
  if (isCounterEnabled(item.parent)) {
    module.experienceCounter.maybeAddItemExperienceCost(
      changed,
      item,
      item.parent
    )
  }
})

Hooks.on('updateActor', (actor: Actor, changed: Changed) => {
  if (isCounterEnabled(actor)) {
    module.experienceCounter.maybeAddExperienceCost(changed, actor)
  }
})

Hooks.on('preUpdateActor', (actor: Actor) => {
  module.experienceCounter.storeActor(actor)
})

Hooks.on('preUpdateItem', (item: Item) => {
  module.experienceCounter.storeItem(item)
})
