import Link from 'next/link'

interface LinkifiedTextProps {
    content: string
    className?: string
}

export function LinkifiedText({ content, className = '' }: LinkifiedTextProps) {
    if (!content) return null

    // URL検出用の正規表現
    const urlRegex = /(https?:\/\/[^\s]+)/g

    // テキストをURLで分割
    const parts = content.split(urlRegex)

    return (
        <p className={`whitespace-pre-wrap break-words ${className}`}>
            {parts.map((part, index) => {
                if (part.match(urlRegex)) {
                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline hover:text-blue-600"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </a>
                    )
                }
                return part
            })}
        </p>
    )
}
