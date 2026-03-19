'use client'

import { useState } from 'react'
import { Play, X } from 'lucide-react'

interface VideoPlayerProps {
  videoUrl: string | null
}

interface VideoSource {
  platform: 'youtube' | 'vimeo' | 'loom' | 'tella' | 'custom'
  embedUrl: string
  thumbnailUrl?: string
}

function extractVideoSource(url: string): VideoSource | null {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ]
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      return {
        platform: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&fs=0&controls=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      }
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/]
  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      return {
        platform: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
        // Vimeo doesn't provide direct thumbnail URL from regex, would need API
        thumbnailUrl: undefined,
      }
    }
  }

  // Loom patterns
  const loomPatterns = [/loom\.com\/share\/([a-zA-Z0-9]+)/]
  for (const pattern of loomPatterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      return {
        platform: 'loom',
        embedUrl: `https://www.loom.com/embed/${videoId}`,
        thumbnailUrl: undefined,
      }
    }
  }

  // Tella.tv patterns
  const tellaPatterns = [/tella\.tv\/([a-zA-Z0-9]+)/]
  for (const pattern of tellaPatterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      return {
        platform: 'tella',
        embedUrl: `https://www.tella.tv/${videoId}`,
        thumbnailUrl: undefined,
      }
    }
  }

  // Check if it's a direct embed code (starts with <iframe)
  if (url.trim().startsWith('<iframe')) {
    return {
      platform: 'custom',
      embedUrl: url,
    }
  }

  return null
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const videoSource = videoUrl ? extractVideoSource(videoUrl) : null

  if (!videoUrl || videoUrl.trim() === '') {
    return (
      <div className="w-full max-w-2xl mx-auto aspect-video bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500 text-sm">No hay video para esta lección</p>
      </div>
    )
  }

  if (!videoSource) {
    return (
      <div className="w-full max-w-2xl mx-auto aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center border border-gray-200 gap-3">
        <p className="text-gray-500 text-sm">Formato de video no reconocido</p>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#28B4AD] hover:underline text-sm font-medium"
        >
          Abrir video en nueva pestaña →
        </a>
      </div>
    )
  }

  // Thumbnail or fallback placeholder
  const getThumbnailUrl = () => {
    if (videoSource.thumbnailUrl) return videoSource.thumbnailUrl
    // Fallback placeholder gradient for platforms without thumbnail
    return undefined
  }

  const thumbnailUrl = getThumbnailUrl()

  return (
    <>
      {/* Thumbnail with Play Button */}
      <div className="w-full max-w-2xl mx-auto">
        <div
          onClick={() => setIsModalOpen(true)}
          className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-300 cursor-pointer group"
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Video</span>
            </div>
          )}

          {/* Overlay + Play Button */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-16 h-16 rounded-full bg-[#28B4AD] hover:bg-[#26a095] shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform"
              aria-label="Play video"
            >
              <Play size={28} className="text-white fill-white ml-1" />
            </button>
          </div>

          {/* Platform Badge */}
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
            {videoSource.platform}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 z-10 bg-white/20 hover:bg-white/40 text-white rounded-lg p-2 transition-colors"
              aria-label="Close video"
            >
              <X size={24} />
            </button>

            {/* Video Embed */}
            {videoSource.platform === 'custom' ? (
              // For custom embed codes, render them safely (as close as we can get)
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: videoSource.embedUrl }}
              />
            ) : (
              <iframe
                src={videoSource.embedUrl}
                title="Lesson video"
                allow="autoplay; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                style={{ border: 'none' }}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
