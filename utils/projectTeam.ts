import type { ProjectTeamMember } from '~/data/team'

export const formatInviteLinkLabel = (projectTitle: string, memberCount: number): string => {
  const normalizedTitle = projectTitle.trim()
  const safeTitle = normalizedTitle.length > 0 ? normalizedTitle : 'проект'
  const safeCount = Number.isFinite(memberCount) ? memberCount : 0

  return `Пригласить коллег в «${safeTitle}» (${safeCount})`
}

export const filterTeamMembers = (members: ProjectTeamMember[], query: string): ProjectTeamMember[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU')

  if (normalizedQuery.length === 0) {
    return members.slice()
  }

  return members.filter((member) =>
    [member.name, member.role]
      .map((value) => value.toLocaleLowerCase('ru-RU'))
      .some((value) => value.includes(normalizedQuery)),
  )
}
