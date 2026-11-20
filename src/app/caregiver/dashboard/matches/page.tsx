import { Icons } from '@/components/icons'

export const metadata = {
  title: 'Convites · Cuidador',
  description: 'Converse com as famílias que entraram em contato.',
}

export default function CaregiverMatchesIndexPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 text-center">
      <div>
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
          <Icons.chat className="w-7 h-7" />
        </div>
        <h2 className="font-bold text-lg mb-1">Selecione uma conversa</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Escolha um contato na lista ao lado para responder ao convite ou continuar a conversa.
        </p>
      </div>
    </div>
  )
}
