import type { APIRoute } from 'astro';
import puppeteer from 'puppeteer';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { html, theme } = await request.json();

        if (!html) {
            return new Response('Missing HTML content', { status: 400 });
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        const fullHtml = `
            <!DOCTYPE html>
            <html lang="en" class="${theme === 'dark' ? 'dark' : ''}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css" integrity="sha384-DotA03Hj9wN1BA7nS200jTZE2yY29fMfa2I2P9iYI/2hJ2iG/L4Jk1w2NbCBljT8" crossorigin="anonymous">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body {
                        font-family: sans-serif;
                    }
                    .prose {
                        max-width: 100ch;
                        margin-left: 5%;
                        margin-right: 5%;
                        line-height: 1.6;
                    }
                    .dark .dark\:prose-invert {
                        color: #d1d5db;
                    }
                     .dark body {
                        background-color: #1f2937;
                        color: #d1d5db;
                    }
                </style>
            </head>
            <body>
                <div class="prose dark:prose-invert">
                    ${html}
                </div>
            </body>
            </html>
        `;

        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '8mm',
                right: '8mm',
                bottom: '8mm',
                left: '8mm',
            },
        });

        await browser.close();

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="download.pdf"',
            },
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return new Response('Error generating PDF', { status: 500 });
    }
}; 