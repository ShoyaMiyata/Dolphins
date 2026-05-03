'use client'

import { useState } from 'react'

interface ImageItem {
  id: string
  image_url: string
}

interface Props {
  images: ImageItem[]
  onImageClick: (url: string) => void
}

export function PostImages({ images, onImageClick }: Props) {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({})
  const count = images.length
  if (count === 0) return null

  if (count === 1) {
    const img = images[0]
    return (
      <div className="mt-3 rounded-xl overflow-hidden border relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onImageClick(img.image_url)
          }}
          className="block w-full"
          aria-label="画像を拡大"
        >
          {!loaded[img.id] && (
            <div className="aspect-[16/9] bg-gray-100 animate-pulse" />
          )}
          <img
            src={img.image_url}
            alt="投稿画像"
            loading="lazy"
            onLoad={() => setLoaded((p) => ({ ...p, [img.id]: true }))}
            className={`w-full max-h-[420px] object-cover transition-opacity ${
              loaded[img.id] ? 'opacity-100' : 'opacity-0 absolute inset-0'
            }`}
          />
        </button>
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden border aspect-[4/3]">
        <ImageTile
          image={images[0]}
          onClick={onImageClick}
          loaded={loaded}
          setLoaded={setLoaded}
          className="row-span-2"
        />
        <ImageTile
          image={images[1]}
          onClick={onImageClick}
          loaded={loaded}
          setLoaded={setLoaded}
        />
        <ImageTile
          image={images[2]}
          onClick={onImageClick}
          loaded={loaded}
          setLoaded={setLoaded}
        />
      </div>
    )
  }

  const visible = images.slice(0, 4)
  const hasMore = count > 4
  const gridClass =
    count === 2 ? 'grid-cols-2 aspect-[2/1]' : 'grid-cols-2 grid-rows-2 aspect-square'

  return (
    <div className={`mt-3 grid gap-1 rounded-xl overflow-hidden border ${gridClass}`}>
      {visible.map((img, i) => (
        <div key={img.id} className="relative">
          <ImageTile
            image={img}
            onClick={onImageClick}
            loaded={loaded}
            setLoaded={setLoaded}
          />
          {hasMore && i === 3 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white text-xl font-bold pointer-events-none">
              +{count - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface TileProps {
  image: ImageItem
  onClick: (url: string) => void
  loaded: Record<string, boolean>
  setLoaded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  className?: string
}

function ImageTile({ image, onClick, loaded, setLoaded, className }: TileProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick(image.image_url)
      }}
      aria-label="画像を拡大"
      className={`relative block h-full w-full overflow-hidden ${className ?? ''}`}
    >
      {!loaded[image.id] && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      <img
        src={image.image_url}
        alt="投稿画像"
        loading="lazy"
        onLoad={() => setLoaded((p) => ({ ...p, [image.id]: true }))}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
          loaded[image.id] ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </button>
  )
}
