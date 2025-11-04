import { beforeEach, describe, expect, it } from 'vitest'
import { ref, type Ref } from 'vue'

const stateRegistry = new Map<string, Ref<unknown>>()

vi.mock('#imports', () => ({
  useState: <T>(key: string, init: () => T) => {
    if (!stateRegistry.has(key)) {
      stateRegistry.set(key, ref(init()))
    }

    return stateRegistry.get(key) as Ref<T>
  },
}))

import type { ProjectTask } from '../data/projects'
import { filterProjectTasks, useProjectTasks } from '../composables/useProjectTasks'

const mockTasks: ProjectTask[] = [
  {
    id: 'task-1',
    title: 'Настроить деплой',
    assignee: { name: 'Иван Петров', avatarUrl: '' },
    status: 'in_progress',
    dueDate: '2024-10-10',
  },
  {
    id: 'task-2',
    title: 'Подготовить документацию',
    assignee: { name: 'Мария Смирнова', avatarUrl: '' },
    status: 'done',
    dueDate: '2024-09-30',
  },
  {
    id: 'task-3',
    title: 'Исправить просроченные баги',
    assignee: { name: 'Иван Петров', avatarUrl: '' },
    status: 'pending',
    dueDate: '2024-09-01',
  },
]

beforeEach(() => {
  stateRegistry.clear()
})

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

describe('useProjectTasks createTask', () => {
  it('throws error since tasks should be created as orders', async () => {
    const { createTask } = useProjectTasks('design-refresh')

    await expect(
      createTask({
        title: 'Новая фича',
        description: 'Добавить поддержку вложений',
        dueDate: '2024-12-31',
        attachments: [],
        status: 'in_progress',
      }),
    ).rejects.toThrow('Tasks should be created as orders using useOrders composable')
  })
})
