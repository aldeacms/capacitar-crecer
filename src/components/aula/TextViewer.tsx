interface TextViewerProps {
  contenido: string | null
}

export default function TextViewer({ contenido }: TextViewerProps) {
  if (!contenido || contenido.trim() === '') {
    return (
      <div className="w-full bg-gray-50 rounded-xl p-8 border border-gray-200 flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500 text-sm">No hay contenido para esta lección</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-8">
      <div
        className="prose prose-sm max-w-none
          prose-headings:text-gray-900 prose-headings:font-bold
          prose-p:text-gray-700 prose-p:leading-relaxed
          prose-a:text-[#28B4AD] prose-a:underline hover:prose-a:text-[#1f9593]
          prose-strong:text-gray-900 prose-strong:font-bold
          prose-em:text-gray-700
          prose-ul:text-gray-700 prose-ol:text-gray-700
          prose-li:text-gray-700 prose-li:marker:text-gray-400
          prose-code:text-red-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
          prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200
          prose-blockquote:border-l-4 prose-blockquote:border-[#28B4AD] prose-blockquote:text-gray-600"
        dangerouslySetInnerHTML={{ __html: contenido }}
      />
    </div>
  )
}
