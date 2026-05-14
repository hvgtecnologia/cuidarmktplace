'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, ShieldCheck, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { simulateCheckoutAction } from '@/app/actions/payment'

export default function PlansPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (plan: string) => {
    setIsLoading(true)
    toast.loading('Iniciando pagamento seguro...', { id: 'payment' })
    
    // Simulating API call to Asaas Checkout / Payment Link Generation
    setTimeout(async () => {
      const res = await simulateCheckoutAction({ planCode: plan })
      if (res.success) {
        toast.success('Assinatura ativada com sucesso! Vagas liberadas.', { id: 'payment' })
        router.push('/family/dashboard')
        router.refresh()
      } else {
        toast.error('Erro ao processar assinatura', { id: 'payment' })
        setIsLoading(false)
      }
    }, 1500)
  }

  return (
    <div className="container max-w-5xl py-16 px-4 mx-auto min-h-screen">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-4">Escolha seu Plano</h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
          Para ter acesso à comunicação direta com todos os nossos cuidadores verificados, escolha como deseja assinar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
         {/* PLANO MENSAL */}
         <Card className="border-2 border-muted bg-white shadow-sm flex flex-col relative overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">Mensal</CardTitle>
              <CardDescription>Para necessidades rápidas</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-center">
               <div className="my-6">
                 <span className="text-5xl font-extrabold">R$ 99</span>
                 <span className="text-muted-foreground font-medium">/mês</span>
               </div>
               <ul className="space-y-3 text-left max-w-xs mx-auto">
                 <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> Acesso ilimitado ao sistema de Matches</li>
                 <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> Cuidadores 100% verificados</li>
                 <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> Suporte humanizado</li>
                 <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> Cancele quando quiser</li>
               </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full text-lg h-14" 
                disabled={isLoading} 
                onClick={() => handleSubscribe('monthly')}
              >
                Assinar Mensal
              </Button>
            </CardFooter>
         </Card>

         {/* PLANO TRIMESTRAL */}
         <Card className="border-2 border-primary bg-primary/5 shadow-lg flex flex-col relative overflow-hidden transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-primary"></div>
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
              MAIS POPULAR
            </div>
            
            <CardHeader className="text-center pb-2 mt-4">
              <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                Trimestral <Zap className="w-5 h-5 fill-accent text-accent" />
              </CardTitle>
              <CardDescription>Melhor custo-benefício</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-center">
               <div className="my-6">
                 <span className="text-5xl font-extrabold">R$ 79</span>
                 <span className="text-muted-foreground font-medium">/mês</span>
               </div>
               <div className="text-sm font-semibold text-accent mb-6">Cobrado R$ 237 a cada 3 meses</div>
               <ul className="space-y-3 text-left max-w-xs mx-auto">
                 <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> Tudo do plano mensal</li>
                 <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> Prioridade no suporte</li>
                 <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> Selo &quot;Família Premium&quot; no Card</li>
                 <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-500" /> Garantia de substituição em 48h</li>
               </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="default" 
                size="lg" 
                className="w-full text-lg h-14 shadow-md hover:scale-[1.02] transition-transform" 
                disabled={isLoading} 
                onClick={() => handleSubscribe('quarterly')}
              >
                Assinar Trimestral
              </Button>
            </CardFooter>
         </Card>
      </div>
    </div>
  )
}
