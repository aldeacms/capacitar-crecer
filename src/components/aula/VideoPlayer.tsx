'use client'

interface VideoPlayerProps {
  videoUrl: string | null
}

function extractYouTubeId(url: string): string | null {
  // Formatos soportados:
  // https://www.youtube.com/watch?v=ID
  // https://youtu.be/ID
  // https://www.youtube.com/embed/ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

function extractVimeoId(url: string): string | null {
  // Formatos soportados:
  // https://vimeo.com/ID
  // https://player.vimeo.com/video/ID
  const patterns = [/(?:vimeo\.com\/|video\/)(\d+)/]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  if (!videoUrl || videoUrl.trim() === '') {
    return (
      <div className="w-full max-w-2xl mx-auto aspect-video bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500 text-sm">No hay video para esta lección</p>
      </div>
    )
  }

  // Intentar detectar YouTube
  const youtubeId = extractYouTubeId(videoUrl)
  if (youtubeId) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&fs=0&controls=1&autohide=1`}
            title="Video de la lección"
            allow="autoplay; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups-to-escape-sandbox"
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    )
  }

  // Intentar detectar Vimeo
  const vimeoId = extractVimeoId(videoUrl)
  if (vimeoId) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
            allow="autoplay; picture-in-picture"
            title="Video de la lección"
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    )
  }

  // Si no se reconoce el formato, mostrar link directo
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
