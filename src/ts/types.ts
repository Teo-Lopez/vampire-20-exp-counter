import ExperienceCounter from './apps/experienceCounter'

export interface MyModule extends Game.ModuleCollection {
  experienceCounter: ExperienceCounter
}
