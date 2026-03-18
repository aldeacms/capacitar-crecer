/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Heading from '@tiptap/extension-heading'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Link as LinkIcon,
  CodeXml,
  Heading4,
  Heading5
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  label?: string
}

const MenuBar = ({ editor, showSource, setShowSource }: { editor: any, showSource: boolean, setShowSource: (val: boolean) => void }) => {
  if (!editor) return null

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-50/50 items-center">
      <div className="flex gap-1 pr-2 border-r border-gray-200">
        <button type="button"
          disabled={showSource}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 ${editor.isActive('bold') ? 'bg-gray-200 text-[#28B4AD]' : 'text-gray-600'}`}
          title="Negrita"
        >
          <Bold size={18} />
        </button>
        <button type="button"
          disabled={showSource}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 ${editor.isActive('italic') ? 'bg-gray-200 text-[#28B4AD]' : 'text-gray-600'}`}
          title="Itálica"
        >
          <Italic size={18} />
        </button>
        <button type="button"
          disabled={showSource}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 ${editor.isActive('underline') ? 'bg-gray-200 text-[#28B4AD]' : 'text-gray-600'}`}
          title="Subrayado"
        >
          <UnderlineIcon size={18} />
        </button>
      </div>

      <div className="flex gap-1 px-2 border-r border-gray-200">
        <button type="button"
          disabled={showSource}
          onClick={() => editor.chain().focus().unsetBold().toggleHeading({ level: 4 }).run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 ${editor.isActive('heading', { level: 4 }) ? 'bg-gray-200 text-[#28B4AD]' : 'text-gray-600'}`}
          title="Encabezado 4"
        >
          <Heading4 size={18} />
        </button>
        <button type="button"
          disabled={showSource}
          onClick={() => editor.chain().focus().unsetBold().toggleHeading({ level: 5 }).run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 ${editor.isActive('heading', { level: 5 }) ? 'bg-gray-200 text-[#28B4AD]' : 'text-gray-600'}`}
          title="Encabezado 5"
        >
          <Heading5 size={18} />
        </button>
      </div>

      <div className="flex gap-1 px-2 border-r border-gray-200">
        <button type="button"
          disabled={showSource}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 ${editor.isActive('bulletList') ? 'bg-gray-200 text-[#28B4AD]' : 'text-gray-600'}`}
          title="Lista desordenada"
        >
          <List size={18} />
        </button>
        <button type="button"
          disabled={showSource}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 ${editor.isActive('orderedList') ? 'bg-gray-200 text-[#28B4AD]' : 'text-gray-600'}`}
          title="Lista ordenada"
        >
          <ListOrdered size={18} />
        </button>
        <button type="button"
          disabled={showSource}
          onClick={setLink}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 ${editor.isActive('link') ? 'bg-gray-200 text-[#28B4AD]' : 'text-gray-600'}`}
          title="Insertar link"
        >
          <LinkIcon size={18} />
        </button>
      </div>

      <div className="ml-auto">
        <button type="button"
          onClick={() => setShowSource(!showSource)}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${showSource ? 'bg-[#28B4AD] text-white' : 'text-gray-600'}`}
          title="Ver código fuente"
        >
          <CodeXml size={18} />
        </button>
      </div>
    </div>
  )
}

export default function RichTextEditor({ content, onChange, label }: RichTextEditorProps) {
  const [showSource, setShowSource] = useState(false)
  const [htmlContent, setHtmlContent] = useState(content)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Desactivamos el heading por defecto de starter-kit
      }),
      Heading.configure({
        levels: [4, 5], // SOLO permitimos H4 y H5
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#28B4AD] underline cursor-pointer',
        },
      }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setHtmlContent(html)
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[200px] outline-none transition-all text-gray-900',
      },
    },
  })

  // Sincronizar contenido externo -> editor (Senior Standard)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const prettifyHTML = (html: string) => {
    // Un formateador básico con Regex para separar etiquetas de bloque
    const formatted = html.replace(/(<\/?(?:h3|h4|h5|p|ul|ol|li|div|br)[^>]*>)/g, '\n$1\n')
    return formatted.replace(/\n+/g, '\n').trim()
  }

  // Sincronizar textarea -> editor cuando cambia el modo
  useEffect(() => {
    if (!showSource && editor) {
      // Al salir de código fuente, refrescamos el editor con el contenido del textarea
      if (editor.getHTML() !== htmlContent) {
        editor.commands.setContent(htmlContent)
      }
    } else if (showSource && editor) {
      // Al entrar a código fuente, formateamos el HTML para que sea legible
      const rawHtml = editor.getHTML()
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHtmlContent(prettifyHTML(rawHtml))
    }
  }, [showSource, editor])

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value
    setHtmlContent(newHtml)
    onChange(newHtml)
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>}
      
      <div className="flex flex-col border border-gray-300 rounded-lg overflow-hidden relative bg-white focus-within:border-[#28B4AD] transition-all shadow-sm">
        {/* Sticky Toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm p-2 flex flex-wrap gap-1">
          <MenuBar editor={editor} showSource={showSource} setShowSource={setShowSource} />
        </div>
        
        {/* Editor Area with Internal Scroll */}
        <div className="max-h-[400px] overflow-y-auto p-4 bg-slate-50 prose prose-slate max-w-none prose-h4:text-lg prose-h4:font-semibold prose-h5:text-base prose-h5:font-medium">
          {showSource ? (
            <textarea
              value={htmlContent}
              onChange={handleSourceChange}
              className="w-full min-h-[300px] font-mono text-sm text-gray-800 bg-gray-900 !text-green-400 outline-none resize-none p-4 rounded-md"
              spellCheck={false}
            />
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>
      </div>
    </div>
  )
}
