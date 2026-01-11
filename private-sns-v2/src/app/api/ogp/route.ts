import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    try {
        // URLのバリデーション
        new URL(url)

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'bot',
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        const ogData = {
            title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
            description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
            image: $('meta[property="og:image"]').attr('content') || '',
            siteName: $('meta[property="og:site_name"]').attr('content') || '',
            url: url,
        }

        return NextResponse.json(ogData)
    } catch (error) {
        console.error('OGP fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch OGP data' }, { status: 500 })
    }
}
