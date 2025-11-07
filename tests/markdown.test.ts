import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '~/utils/markdown'

describe('renderMarkdown', () => {
  it('escapes html tags to avoid executing scripts', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('does not allow image tags with javascript handlers', () => {
    const html = renderMarkdown('**bold** <img src=x onerror=alert(1)>')
    expect(html).toContain('<strong>bold</strong> &lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img')
  })
})
