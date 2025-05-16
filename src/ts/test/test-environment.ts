import { beforeAll } from 'vitest'

// Mock FoundryVTT globals
beforeAll(() => {
  console.log('Setting up test environment')

  // Mock Application class
  const ApplicationMock = class {
    constructor() {}
    render() {}
    close() {}
  }
  Object.defineProperty(global, 'Application', {
    value: ApplicationMock,
    writable: true,
  })

  // Mock Actor class
  const ActorMock = class {
    static create() {}
    system: any
    items: any[]
    constructor() {
      this.system = {}
      this.items = []
    }
  }
  Object.defineProperty(global, 'Actor', {
    value: ActorMock,
    writable: true,
  })

  // Mock Item class
  const ItemMock = class {
    static create() {}
    system: any
    _id: string
    constructor() {
      this.system = {}
      this._id = ''
    }
  }
  Object.defineProperty(global, 'Item', {
    value: ItemMock,
    writable: true,
  })
})
