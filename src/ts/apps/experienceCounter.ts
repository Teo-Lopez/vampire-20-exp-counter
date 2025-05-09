import { propertiesMap } from '../constants'
import { Changed } from '../module'

interface AttributeChange {
  groupPath: string[]
  property: string
  oldValue: number
  newValue: number
  amount?: number
}

// Paths
// abilities.key.value
// attributes.key.value
// advantages.virtues.key.permanent
// advantages.key.permanent
// advantages.key.permanent

const primaryGroups = ['abilities', 'attributes', 'advantages']
const secondaryGroups = ['virtues']

export default class ExperienceCounter extends Application {
  previousActor: Actor | null = null

  experienceMultipliers: Record<string, number> = {
    attributes: 4,
    abilities: 2,
    power: 5,
    conscience: 2, //virtues
    courage: 2, //virtues
    selfcontrol: 2, //virtues
    path: 2,
    willpower: 1,
  }

  acquisitionCosts: Record<string, number> = {
    abilities: 3,
  }

  maybeAddExperienceCost(changed: Changed, actor: Actor) {
    this.searchPropertyRecursively(changed)
    this.updateAttribute(changed, actor)
  }

  updateAttribute(changed: Changed, actor: Actor) {
    if (!this.previousActor) return

    const attributeChangeData = this.getValuesChanged(
      changed,
      this.previousActor
    )
    const amount = this.calcExperienceCost(attributeChangeData)

    this.createExperienceItem({ amount, ...attributeChangeData }, actor)
  }

  getValuesChanged(changed: Changed, previousActor: Actor): AttributeChange {
    const { groupPath, property } = this.getPropertyChanged(changed)

    const isSecondaryGroup = groupPath.length > 1

    const oldSystem = previousActor.system as Record<string, any>
    const oldValue = isSecondaryGroup
      ? this.getPropertyValue(oldSystem[groupPath[0]][groupPath[1]][property])
      : this.getPropertyValue(oldSystem[groupPath[0]][property])

    const newValue = isSecondaryGroup
      ? this.getPropertyValue(
          changed.system[groupPath[0]][groupPath[1]][property]
        )
      : this.getPropertyValue(changed.system[groupPath[0]][property])

    const valuesChanged = {
      groupPath,
      property,
      oldValue,
      newValue,
    }

    return valuesChanged
  }

  private getPropertyChanged(changed: Changed): {
    groupPath: string[]
    property: string
  } {
    return {
      groupPath: this.getGroupChangedPath(changed),
      property: this.getKeyChanged(changed),
    }
  }

  calcExperienceCost({
    groupPath,
    oldValue,
    newValue,
    property,
  }: AttributeChange) {
    const multiplier =
      this.experienceMultipliers[groupPath[0]] ||
      this.experienceMultipliers[property]

    const amount = this.sumExperienceCost(oldValue, newValue, multiplier)
    return amount || this.acquisitionCosts[groupPath[0]]
  }

  sumExperienceCost(oldValue: number, newValue: number, multiplier: number) {
    const isIncrease = newValue > oldValue
    const difference = Math.abs(newValue - oldValue)
    let baseCost = isIncrease ? oldValue : newValue
    let totalCost = 0
    for (let i = 0; i < difference; i++) {
      totalCost += baseCost * multiplier
      baseCost++
    }
    return totalCost
  }

  createExperienceItem(
    { amount, property, oldValue, newValue }: AttributeChange,
    actor: Actor
  ) {
    const isIncrease = newValue > oldValue
    const type = isIncrease ? 'wod.types.expspent' : 'wod.types.expgained'
    actor.createEmbeddedDocuments('Item', [
      {
        name: 'Gasto exp',
        type: 'Experience' as 'base',
        system: {
          iscreated: true,
          isactive: false,
          isvisible: true,
          version: '4.1.5',
          parentid: '',
          worldanvil: '',
          reference: '',
          description: `${property} de ${oldValue} a ${newValue}`,
          details: '',
          property: [],
          bonuslist: [],
          isspent: isIncrease,
          amount: amount,
          type,
        },
        img: 'icons/svg/item-bag.svg',
        effects: [],
        folder: null,
        sort: 0,
      },
    ])
  }

  storeActor(actor: Actor) {
    this.previousActor = { ...actor } as Actor
  }

  private getGroupChangedPath(changed: Changed) {
    const primaryGroup = primaryGroups.find(
      (group) => Object.keys(changed.system)[0] === group
    )
    if (!primaryGroup) throw Error('not valid value')

    const secondaryGroup = secondaryGroups.find(
      (group) => Object.keys(changed.system[primaryGroup])[0] === group
    )

    return secondaryGroup ? [primaryGroup, secondaryGroup] : [primaryGroup]
  }

  private getKeyChanged(changed: Changed): string {
    const groupPath = this.getGroupChangedPath(changed)
    const isSecondary = groupPath.length > 1
    return isSecondary
      ? Object.keys(changed.system[groupPath[0]][groupPath[1]])[0]
      : Object.keys(changed.system[groupPath[0]])[0]
  }

  private getPropertyValue(property: Record<string, any>) {
    return property.permanent || property.value
  }

  private searchPropertyRecursively(changed: Record<string, any>): string {
    const object = changed.system || changed
    const key = Object.keys(object)[0]
    if (!propertiesMap[key]) return this.searchPropertyRecursively(object[key])
    else return key
  }
}
