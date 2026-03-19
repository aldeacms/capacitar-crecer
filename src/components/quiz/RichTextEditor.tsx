/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, ImageIcon } from 'lucide-react'
import { uploadQuestionImage } from '@/actions/quiz'
import { toast } from 'sonner'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Underline,
      Image.configure({ allowBase64: true })
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    }
  })

  if (!editor) return null

  const handleImageUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('imagen', file)

    const result = await uploadQuestionImage(formData)

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    editor.chain().focus().setImage({ src: result.url }).run()
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      handleImageUpload(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run()
  const toggleItalic = () => editor.chain().focus().toggleItalic().run()
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run()
  const setLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-t-xl border border-b-0 border-gray-300 flex-wrap">
        <button
          type="button"
          onClick={toggleBold}
          className={`p-2 rounded-lg transition-all ${
            editor.isActive('bold') ? 'bg-[#28B4AD] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>

        <button
          type="button"
          onClick={toggleItalic}
          className={`p-2 rounded-lg transition-all ${
            editor.isActive('italic') ? 'bg-[#28B4AD] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>

        <button
          type="button"
          onClick={toggleUnderline}
          className={`p-2 rounded-lg transition-all ${
            editor.isActive('underline') ? 'bg-[#28B4AD] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded-lg transition-all ${
            editor.isActive('link') ? 'bg-[#28B4AD] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
          title="Link"
        >
          <LinkIcon size={16} />
        </button>

        <button
          type="button"
          onClick={handleImageClick}
          className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-100 transition-all"
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none w-full px-4 py-3 border border-gray-300 rounded-b-xl bg-white outline-none focus-within:border-[#28B4AD] focus-within:ring-4 focus-within:ring-[#28B4AD]/20 shadow-sm transition-all"
      />
    </div>
  )
}
