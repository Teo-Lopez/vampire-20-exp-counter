import { Changed } from '../module'

interface AttributeChange {
  group: string
  property: string
  oldValue: number
  newValue: number
  amount?: number
}
export default class ExperienceCounter extends Application {
  previousActor: Actor | null = null
  propertyGroupPaths = {
    disciplines: 'wod.types.discipline',
    disciplinePath: 'wod.types.disciplinepath',
    attributes: 'attributes',
    abilities: 'abilities',
  }
  experienceMultipliers: Record<string, number> = {
    attributes: 4,
    abilities: 2,
  }

  maybeAddExperienceCost(changed: Changed, actor: Actor) {
    if (!this.previousActor) return
    const attributeChangeData = this.getValuesChanged(
      changed,
      this.previousActor
    )
    const amount = this.calcExperienceCost(attributeChangeData)
    this.createExperienceItem({ amount, ...attributeChangeData }, actor)
  }

  storeActor(actor: Actor) {
    this.previousActor = { ...actor } as Actor
  }

  getValuesChanged(changed: Changed, previousActor: Actor): AttributeChange {
    const { group, property } = this.getPropertyChanged(changed)
    const oldValue = (previousActor.system as Record<string, any>)[group][
      property
    ].value
    const newValue = changed.system[group][property].value

    const valuesChanged = {
      group,
      property,
      oldValue,
      newValue,
    }

    return valuesChanged
  }

  private getPropertyChanged(changed: Changed): {
    group: string
    property: string
  } {
    const propertiesChanged = { ...changed.system }
    for (let group in this.propertyGroupPaths) {
      if (propertiesChanged[group]) {
        return {
          group,
          property: Object.keys(propertiesChanged[group])[0],
        }
      }
    }

    return {
      group: '',
      property: '',
    }
  }

  calcExperienceCost({ group, oldValue, newValue }: AttributeChange) {
    const multiplier = this.experienceMultipliers[group]

    if (newValue > oldValue) {
      return this.sumExperienceCost(oldValue, newValue, multiplier)
    } else if (oldValue > newValue) {
      return this.sumExperienceCost(newValue, oldValue, multiplier)
    } else {
      return 0
    }
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
    console.log(totalCost)
    return totalCost
  }

  createExperienceItem(
    { amount, property, oldValue, newValue }: AttributeChange,
    actor: Actor
  ) {
    const isIncrease = newValue > oldValue
    const type = isIncrease ? 'wod.types.expgained' : 'wod.types.expspent'
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
          isspent: true,
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
}
