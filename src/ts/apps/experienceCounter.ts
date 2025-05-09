import { propertiesMap } from '../constants'
import { Changed } from '../module'

interface AttributeChange {
  property: string
  oldValue: number
  newValue: number
  amount?: number
}

export default class ExperienceCounter extends Application {
  previousActor: Actor | null = null
  previousItem: Item | null = null

  maybeAddItemExperienceCost(changed: Changed, item: Item, parent: Actor) {
    if (!this.previousItem) return
    console.log('item', item)
    console.log('parent', parent)
    const property = (item.system as Record<string, any>).type
    const propertyConfig = propertiesMap[property]
    if (!propertyConfig) {
      throw new Error(`Property ${property} not found in propertiesMap`)
    }
    const key: string = propertyConfig.key

    const oldValue = (this.previousItem.system as Record<string, any>)[key]
    const newValue = changed.system.value

    const amount = this.calcExperienceCost({
      property,
      oldValue,
      newValue,
    })

    this.createExperienceItem(
      { amount, property: item.name, oldValue, newValue },
      parent
    )
  }

  maybeAddExperienceCost(changed: Changed, actor: Actor) {
    const property = this.searchPropertyRecursively(changed)

    if (property) {
      this.updateAttribute(changed, actor, property)
    }
  }

  updateAttribute(changed: Changed, actor: Actor, property: string) {
    if (!this.previousActor) return

    const attributeChangeData = this.getValuesChanged(
      changed,
      this.previousActor,
      property
    )
    const amount = this.calcExperienceCost(attributeChangeData)

    this.createExperienceItem({ amount, ...attributeChangeData }, actor)
  }

  getValuesChanged(
    changed: Changed,
    previousActor: Actor,
    knownProperty: string
  ): AttributeChange {
    const property = knownProperty
    const propertyConfig = propertiesMap[property]

    if (!propertyConfig) {
      throw new Error(`Property ${property} not found in propertiesMap`)
    }

    const groupPath = propertyConfig.path
    const valueKey = propertyConfig.valueKey

    const { oldValue, newValue } = this.getOldAndNewValueFromActorProperty(
      changed,
      previousActor,
      groupPath,
      property,
      valueKey
    )

    return {
      property,
      oldValue,
      newValue,
    }
  }

  private getOldAndNewValueFromActorProperty(
    changed: Changed,
    previousActor: Actor,
    groupPath: string[],
    property: string,
    valueKey: string
  ) {
    const oldValue = this.getValueFromByPath(
      previousActor.system,
      groupPath,
      property,
      valueKey
    )
    const newValue = this.getValueFromByPath(
      changed.system,
      groupPath,
      property,
      valueKey
    )
    return { oldValue, newValue }
  }

  private getValueFromByPath(
    system: Record<string, any>,
    groupPath: string[],
    property: string,
    valueKey: string
  ): number {
    // Navigate through the paths to get the values based on the path from propertiesMap
    if (groupPath.length === 1) {
      return system[groupPath[0]][property][valueKey]
    }
    return system[groupPath[0]][groupPath[1]][property][valueKey]
  }

  calcExperienceCost({ oldValue, newValue, property }: AttributeChange) {
    const { multiplier, acquisitionCost } = propertiesMap[property]

    const amount = this.sumExperienceCost(
      oldValue,
      newValue,
      multiplier,
      acquisitionCost
    )
    return amount === 0 ? acquisitionCost : amount
  }

  sumExperienceCost(
    oldValue: number,
    newValue: number,
    multiplier: number,
    acquisitionCost: number
  ) {
    const isIncrease = newValue > oldValue
    const difference = Math.abs(newValue - oldValue)
    let baseCost = isIncrease ? oldValue : newValue
    let totalCost = 0
    for (let i = 0; i < difference; i++) {
      if (baseCost === 0) {
        totalCost += acquisitionCost
      } else {
        totalCost += baseCost * multiplier
        baseCost++
      }
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

  private searchPropertyRecursively(changed: Record<string, any>): string {
    const object = changed.system || changed
    const key = Object.keys(object)[0]
    if (!propertiesMap[key]) {
      const newChanged = { system: object[key] }
      return this.searchPropertyRecursively(newChanged)
    } else return key
  }

  storeItem(item: Item) {
    this.previousItem = { ...item } as Item
  }
}
