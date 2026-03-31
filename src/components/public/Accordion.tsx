'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SafeHTML } from '@/components/ui/SafeHTML'

interface AccordionItemProps {
  title: string
  content: string
  isOpen: boolean
  onClick: () => void
}

function AccordionItem({ title, content, isOpen, onClick }: AccordionItemProps) {
  return (
    <div className={`group transition-all duration-500 border-b border-slate-100 last:border-0 ${isOpen ? 'bg-slate-50 -mx-4 px-6 rounded-3xl border-transparent' : ''}`}>
      <h3 className="block w-full">
        <button
          onClick={onClick}
          className="w-full py-7 flex justify-between items-center text-left transition-all group"
        >
          <div className="flex items-center">
            {/* REMOVIDO: El contador numérico para un look más minimalista */}
            <span className={`text-lg md:text-xl font-bold tracking-tight transition-colors ${isOpen ? 'text-[#2DB3A7]' : 'text-slate-800 group-hover:text-[#2DB3A7]'}`}>
              {title}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-[#2DB3A7] border-[#2DB3A7] text-white rotate-45 shadow-lg shadow-[#2DB3A7]/20' : 'bg-white border-slate-200 text-slate-400 group-hover:border-[#2DB3A7] group-hover:text-[#2DB3A7]'}`}>
            <Plus size={20} strokeWidth={2.5} />
          </div>
        </button>
      </h3>

      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] pb-10 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="pr-4"> {/* Ajustado el padding al quitar el número */}
            <SafeHTML
              html={content || ''}
              tag="div"
              className="prose prose-slate prose-sm md:prose-base max-w-none 
                         prose-p:text-slate-600 prose-p:leading-relaxed 
                         prose-strong:text-slate-900 prose-strong:font-black 
                         prose-headings:text-slate-900 prose-headings:font-bold
                         prose-ul:list-disc prose-ul:pl-5
                         prose-li:text-slate-600 prose-li:my-1"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface AccordionProps {
  items: {
    title: string
    content: string
  }[]
}

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  if (!items.length) return null

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          content={item.content}
          isOpen={openIndex === index}
          onClick={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </div>
  )
}