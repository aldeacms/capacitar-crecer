'use client'

import { useEffect, useState } from 'react'

interface SafeHTMLProps {
  html: string
  className?: string
  tag?: 'div' | 'span' | 'article' | 'section'
  allowTags?: string[]
  allowAttributes?: Record<string, string[]>
  wrapperProps?: React.HTMLAttributes<HTMLElement>
}

export function SafeHTML({ 
  html, 
  className = '', 
  tag = 'div',
  allowTags, 
  allowAttributes,
  wrapperProps = {}
}: SafeHTMLProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !html) {
      setSanitizedHtml('')
      return
    }

    const sanitize = async () => {
      try {
        // Importación dinámica para evitar problemas con SSR
        const DOMPurify = (await import('dompurify')).default
        
        // Configurar opciones de sanitización
        const config: any = {
          ALLOWED_TAGS: allowTags || [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'hr', 'pre', 'code',
            'strong', 'em', 'b', 'i', 'u', 's',
            'ul', 'ol', 'li',
            'a', 'img', 'video', 'audio', 'source',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'div', 'span', 'blockquote', 'cite',
            'sup', 'sub', 'mark', 'small',
            'iframe' // Permitir iframes pero con sanitización especial
          ],
          ALLOWED_ATTR: allowAttributes || [
            'href', 'src', 'alt', 'title', 'width', 'height',
            'class', 'style', 'id', 'name',
            'target', 'rel', 'frameborder', 'allowfullscreen',
            'controls', 'autoplay', 'loop', 'muted', 'poster'
          ],
          ALLOW_DATA_ATTR: false,
          USE_PROFILES: { html: true },
          // Configuración específica para iframes
          ADD_TAGS: ['iframe'],
          ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
        }

        // Sanitizar el HTML
        const clean = DOMPurify.sanitize(html, config)
        setSanitizedHtml(clean)
      } catch (error) {
        console.error('Error sanitizing HTML:', error)
        setSanitizedHtml('')
      }
    }

    sanitize()
  }, [html, isMounted, allowTags, allowAttributes])

  if (!isMounted || !sanitizedHtml) {
    const Element = tag
    return <Element className={className} {...wrapperProps} />
  }

  const Element = tag
  return (
    <Element
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      {...wrapperProps}
    />
  )
}