import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { Hero } from '@/components/landing/hero'
import { TrustBar } from '@/components/landing/trust-bar'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Features } from '@/components/landing/features'
import { Testimonials } from '@/components/landing/testimonials'
import { Pricing } from '@/components/landing/pricing'
import { FAQ } from '@/components/landing/faq'
import { CTA } from '@/components/landing/cta'

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <TrustBar />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <SiteFooter />
    </>
  )
}
