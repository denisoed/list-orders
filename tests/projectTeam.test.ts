import { describe, expect, it } from 'vitest'
import { filterTeamMembers, formatInviteLinkLabel } from '~/utils/projectTeam'
import type { ProjectTeamMember } from '~/data/team'

describe('formatInviteLinkLabel', () => {
  it('formats label with project name and member count', () => {
    expect(formatInviteLinkLabel('Проект А', 3)).toBe('Пригласить коллег в «Проект А» (3)')
  })

  it('uses fallback name when title is empty', () => {
    expect(formatInviteLinkLabel('   ', 5)).toBe('Пригласить коллег в «проект» (5)')
  })

  it('normalizes invalid member count', () => {
    // @ts-expect-error testing runtime coercion
    expect(formatInviteLinkLabel('CRM', Number.NaN)).toBe('Пригласить коллег в «CRM» (0)')
  })
})

describe('filterTeamMembers', () => {
  const members: ProjectTeamMember[] = [
    { id: '1', name: 'Анна Кузнецова', role: 'Дизайнер', avatarUrl: 'avatar-1' },
    { id: '2', name: 'Иван Иванов', role: 'Разработчик', avatarUrl: 'avatar-2' },
    { id: '3', name: 'Мария Петрова', role: 'Маркетолог', avatarUrl: 'avatar-3' },
  ]

  it('returns all members when query is empty', () => {
    expect(filterTeamMembers(members, '')).toHaveLength(3)
  })

  it('filters by name ignoring case', () => {
    const result = filterTeamMembers(members, 'иванов')
    expect(result).toEqual([{ id: '2', name: 'Иван Иванов', role: 'Разработчик', avatarUrl: 'avatar-2' }])
  })

  it('filters by role', () => {
    const result = filterTeamMembers(members, 'дизай')
    expect(result).toEqual([{ id: '1', name: 'Анна Кузнецова', role: 'Дизайнер', avatarUrl: 'avatar-1' }])
  })
})
