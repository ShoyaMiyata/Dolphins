'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, ImageIcon } from 'lucide-react'

interface OgpData {
    title: string
    description: string
    image: string
    siteName: string
    url: string
}

interface UrlPreviewCardProps {
    url: string
}

export function UrlPreviewCard({ url }: UrlPreviewCardProps) {
    const { data, isLoading, isError } = useQuery<OgpData>({
        queryKey: ['ogp', url],
        queryFn: async () => {
            const res = await fetch(`/api/ogp?url=${encodeURIComponent(url)}`)
            if (!res.ok) throw new Error('Failed to fetch OGP')
            return res.json()
        },
        staleTime: 1000 * 60 * 60 * 24, // 24時間キャッシュ
        retry: 1,
    })

    if (isLoading) {
        return (
            <Card className="mt-2 overflow-hidden border border-gray-200">
                <div className="h-48 w-full bg-gray-100 animate-pulse" />
                <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                </div>
            </Card>
        )
    }

    if (isError || !data || (!data.title && !data.image)) {
        return null
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 group no-underline"
            onClick={(e) => e.stopPropagation()}
        >
            <Card className="overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors group-hover:shadow-sm max-w-full">
                {data.image && (
                    <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                        <img
                            src={data.image}
                            alt={data.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                                // 画像読み込みエラー時は非表示にする
                                (e.target as HTMLImageElement).style.display = 'none'
                            }}
                        />
                    </div>
                )}
                <div className="p-3 bg-white">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        {data.siteName && <span>{data.siteName}</span>}
                        <span className="truncate flex-1">{new URL(url).hostname}</span>
                    </div>
                    {data.title && (
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1 group-hover:text-blue-600">
                            {data.title}
                        </h3>
                    )}
                    {data.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                            {data.description}
                        </p>
                    )}
                </div>
            </Card>
        </a>
    )
}
