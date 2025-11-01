import { describe, expect, it } from 'vitest'
import type { ProjectTask } from '../data/projects'
import { filterProjectTasks } from '../composables/useProjectTasks'

const mockTasks: ProjectTask[] = [
  {
    id: 'task-1',
    title: 'Настроить деплой',
    assignee: { name: 'Иван Петров', avatarUrl: '' },
    status: 'in_progress',
    dueDate: '2024-10-10',
    priority: 'high',
  },
  {
    id: 'task-2',
    title: 'Подготовить документацию',
    assignee: { name: 'Мария Смирнова', avatarUrl: '' },
    status: 'done',
    dueDate: '2024-09-30',
    priority: 'medium',
  },
  {
    id: 'task-3',
    title: 'Исправить просроченные баги',
    assignee: { name: 'Иван Петров', avatarUrl: '' },
    status: 'overdue',
    dueDate: '2024-09-01',
    priority: 'high',
    overdueDays: 3,
  },
]

describe('filterProjectTasks', () => {
  it('returns all tasks when filter is "all" and query is empty', () => {
    const result = filterProjectTasks(mockTasks, 'all', '')

    expect(result).toHaveLength(mockTasks.length)
  })

  it('filters tasks by status', () => {
    const result = filterProjectTasks(mockTasks, 'in_progress', '')

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('task-1')
  })

  it('applies case-insensitive search across title and assignee name', () => {
    const result = filterProjectTasks(mockTasks, 'all', 'иван')

    expect(result.map((task) => task.id)).toEqual(['task-1', 'task-3'])
  })

  it('returns empty array when no task matches both status and query', () => {
    const result = filterProjectTasks(mockTasks, 'review', 'иван')

    expect(result).toHaveLength(0)
  })
})
