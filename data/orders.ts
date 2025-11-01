import { PROJECTS, type Project, type ProjectTask } from './projects'

export interface OrderDetails {
  project: Project
  task: ProjectTask
}

export interface FetchOrderDetailsOptions {
  projectId?: string
  source?: Project[]
  signal?: AbortSignal
}

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    const timer = setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', onAbort)
      }
      resolve()
    }, ms)

    if (signal) {
      if (signal.aborted) {
        onAbort()
        return
      }

      signal.addEventListener('abort', onAbort, { once: true })
    }
  })

export const fetchOrderDetails = async (
  orderId: string,
  options: FetchOrderDetailsOptions = {},
): Promise<OrderDetails> => {
  const { projectId, source = [], signal } = options

  await delay(180, signal)

  const projectsSource = source.length > 0 ? source : PROJECTS

  const scopedProjects =
    projectId != null
      ? projectsSource.filter((project) => project.id === projectId)
      : projectsSource

  const searchPool = scopedProjects.length > 0 ? scopedProjects : projectsSource

  let resolvedProject: Project | undefined
  let resolvedTask: ProjectTask | undefined

  if (searchPool.length > 0) {
    resolvedProject = searchPool.find((project) =>
      project.tasks.some((task) => task.id === orderId),
    )
    resolvedTask = resolvedProject?.tasks.find((task) => task.id === orderId)
  }

  if (!resolvedTask || !resolvedProject) {
    throw createOrderNotFoundError(orderId)
  }

  return {
    project: resolvedProject,
    task: resolvedTask,
  }
}

export const createOrderNotFoundError = (orderId: string) => {
  const error = new Error(`Order ${orderId} not found`)
  ;(error as Error & { code?: string }).code = 'ORDER_NOT_FOUND'
  return error
}
