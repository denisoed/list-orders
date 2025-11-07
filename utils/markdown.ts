export function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatInline(text: string) {
  let html = escapeHtml(text)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  html = html.replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/_(?!\s)(.+?)(?<!\s)_/g, '<em>$1</em>')
  html = html.replace(/`([^`]+?)`/g, '<code class="rounded bg-black/50 px-1 py-0.5 text-sm">$1</code>')
  return html
}

export function renderMarkdown(text: string) {
  if (!text) {
    return ''
  }

  const lines = text.split(/\r?\n/)
  const htmlParts: string[] = []
  let inUl = false
  let inOl = false

  const closeLists = () => {
    if (inUl) {
      htmlParts.push('</ul>')
      inUl = false
    }
    if (inOl) {
      htmlParts.push('</ol>')
      inOl = false
    }
  }

  for (const line of lines) {
    const ulMatch = /^[-*]\s+(.*)$/.exec(line)
    const olMatch = /^(\d+)\.\s+(.*)$/.exec(line)

    if (ulMatch) {
      if (!inUl) {
        closeLists()
        htmlParts.push('<ul class="list-disc space-y-1 pl-5">')
        inUl = true
      }
      htmlParts.push(`<li>${formatInline(ulMatch[1])}</li>`)
      continue
    }

    if (olMatch) {
      if (!inOl) {
        closeLists()
        htmlParts.push('<ol class="list-decimal space-y-1 pl-5">')
        inOl = true
      }
      htmlParts.push(`<li>${formatInline(olMatch[2])}</li>`)
      continue
    }

    closeLists()

    if (!line.trim()) {
      htmlParts.push('<br />')
      continue
    }

    htmlParts.push(`<p>${formatInline(line)}</p>`)
  }

  closeLists()

  return htmlParts.join('')
}
