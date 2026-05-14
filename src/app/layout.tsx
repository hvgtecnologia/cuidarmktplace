import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { checkEnvSecurity } from "@/lib/env-check";
import { ThemeProvider } from "@/components/site/theme-provider";

checkEnvSecurity();

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://cuidemais.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cuide+ | Cuidadores de idosos verificados, em horas",
    template: "%s · Cuide+",
  },
  description:
    "A plataforma mais segura para encontrar cuidadores de idosos verificados. Match em até 24h, perfis avaliados, contratação e pagamentos seguros.",
  applicationName: "Cuide+",
  keywords: [
    "cuidador de idosos",
    "home care",
    "cuidadora",
    "cuidados ao idoso",
    "marketplace de cuidadores",
    "plataforma de saúde",
    "home health",
    "Cuide+",
  ],
  authors: [{ name: "Cuide+" }],
  creator: "Cuide+",
  publisher: "Cuide+",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Cuide+",
    title: "Cuide+ | Cuidadores de idosos verificados, em horas",
    description:
      "Encontre cuidadores de idosos verificados em até 24 horas. Perfis avaliados, contratação e pagamentos seguros.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cuide+ — Cuidadores de idosos verificados",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cuide+ | Cuidadores de idosos verificados",
    description:
      "Encontre cuidadores de idosos verificados em até 24 horas, com segurança e suporte humano.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  category: "health",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1020" },
  ],
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Cuide+",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    "https://instagram.com/cuidemais",
    "https://facebook.com/cuidemais",
    "https://linkedin.com/company/cuidemais",
  ],
  description:
    "Plataforma de marketplace para conectar famílias a cuidadores de idosos verificados.",
  areaServed: { "@type": "Country", name: "BR" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={cn(inter.variable, display.variable)}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans selection:bg-primary/20">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ className: "rounded-xl" }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
