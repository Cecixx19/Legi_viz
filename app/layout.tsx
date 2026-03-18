import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LEGI_VIZ',
  description: 'Visualize e explore dados de 594 parlamentares do Congresso Nacional Brasileiro.',
  keywords: ['transparência', 'parlamentar', 'congresso', 'deputados', 'senadores', 'votações', 'brasil'],
  openGraph: {
    title: 'LEGI_VIZ',
    description: 'Visualize e explore dados de 594 parlamentares do Congresso Nacional Brasileiro.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAFA' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('legi-viz-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body 
        className="antialiased bg-background text-foreground font-sans"
      >
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-foreground focus:text-background focus:rounded"
        >
          Pular para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  )
}
