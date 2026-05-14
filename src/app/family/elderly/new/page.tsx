import { ElderlyProfileForm } from '@/components/forms/elderly/ElderlyProfileForm'

export const metadata = {
  title: 'Novo Perfil de Idoso | Cuide+',
  description: 'Crie um perfil para a pessoa idosa que precisa de cuidados.',
}

export default function NewElderlyPage() {
  return (
    <div className="container max-w-4xl py-10 px-4 md:px-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Cuidar de quem você ama</h1>
        <p className="text-muted-foreground mt-2">
          Preencha as informações do idoso para que a gente possa encontrar os melhores cuidadores para as necessidades dele.
        </p>
      </div>
      
      <ElderlyProfileForm />
    </div>
  )
}
