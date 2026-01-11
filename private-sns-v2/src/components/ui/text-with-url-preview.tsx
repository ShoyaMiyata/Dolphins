'use client'

import { LinkifiedText } from './linkified-text'
import { UrlPreviewCard } from './url-preview-card'

interface TextWithUrlPreviewProps {
    content: string
    className?: string
}

export function TextWithUrlPreview({ content, className = '' }: TextWithUrlPreviewProps) {
    if (!content) return null

    // URL検出用の正規表現
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const matches = content.match(urlRegex)

    // 最初のURLのみプレビュー表示（複数表示するとうるさいため）
    const firstUrl = matches ? matches[0] : null

    return (
        <div className="space-y-2">
            <LinkifiedText content={content} className={className} />

            {firstUrl && (
                <UrlPreviewCard url={firstUrl} />
            )}
        </div>
    )
}
