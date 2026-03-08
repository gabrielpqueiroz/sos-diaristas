import './globals.css'

// ─── SUBSTITUA OS VALORES ABAIXO ───────────────────────────────────────────
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || 'SEU_PIXEL_ID'
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-XXXXXXXXX'
// ────────────────────────────────────────────────────────────────────────────

export const metadata = {
  title: 'SOS Diaristas – Limpeza Profissional em Foz do Iguaçu',
  description:
    'Diaristas profissionais, pontuais e de confiança em Foz do Iguaçu. Mais de 10 anos cuidando dos lares da cidade. Solicite seu orçamento agora!',
  keywords:
    'diaristas foz do iguaçu, limpeza doméstica, faxina foz do iguaçu, limpeza profissional, diarista',
  openGraph: {
    title: 'SOS Diaristas – Limpeza Profissional em Foz do Iguaçu',
    description: 'Diaristas profissionais e de confiança. Solicite seu orçamento!',
    url: 'https://sosdiaristas.com.br',
    siteName: 'SOS Diaristas',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* ── Google Ads Tag ── */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GOOGLE_ADS_ID}');
            `,
          }}
        />

        {/* ── Meta Pixel ── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </head>
      <body className="bg-white text-gray-800 antialiased">{children}</body>
    </html>
  )
}
