import DogBrowser from './apps/dogBrowser';
import ExperienceCounter from './apps/experienceCounter';

export interface MyModule extends Game.ModuleCollection {
  dogBrowser: DogBrowser;
  experienceCounter: ExperienceCounter;
}
