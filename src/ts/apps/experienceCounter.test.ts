import { describe, it, expect } from 'vitest'
import ExperienceCounter from './experienceCounter'
import '../test/test-environment'

describe('ExperienceCounter', () => {
  describe('searchPropertyRecursively', () => {
    it('should find attribute property in nested structure', () => {
      const counter = new ExperienceCounter()
      const input = {
        system: {
          settings: {
            isupdated: false,
          },
          attributes: {
            charisma: {
              value: 4,
            },
          },
        },
        _stats: {
          modifiedTime: 1747390099918,
        },
        _id: 'eVi7bLgM7BHz6aAh',
      }

      const result = counter['searchPropertyRecursively'](input)
      expect(result).toBe('charisma')
    })

    it('should find advantage property in nested structure', () => {
      const counter = new ExperienceCounter()
      const input = {
        system: {
          settings: {
            isupdated: false,
          },
          advantages: {
            virtues: {
              conscience: {
                permanent: 2,
              },
            },
          },
        },
        _stats: {
          modifiedTime: 1747391891533,
        },
        _id: 'eVi7bLgM7BHz6aAh',
      }

      const result = counter['searchPropertyRecursively'](input)
      expect(result).toBe('conscience')
    })
  })
})
