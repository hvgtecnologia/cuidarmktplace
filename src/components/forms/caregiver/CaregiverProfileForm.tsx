'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PlusCircle, Info, ImagePlus } from 'lucide-react'

import { caregiverProfileSchema, type CaregiverProfileFormValues } from '@/lib/validations/caregiver'
import { updateCaregiverProfile } from '@/app/caregiver/profile/actions'
import { CARE_TAGS, SCHEDULES } from '@/constants/care-tags'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Icons } from '@/components/icons'

export const DAYS_OF_WEEK = [
  { value: 'seg', label: 'Segunda-feira' },
  { value: 'ter', label: 'Terça-feira' },
  { value: 'qua', label: 'Quarta-feira' },
  { value: 'qui', label: 'Quinta-feira' },
  { value: 'sex', label: 'Sexta-feira' },
  { value: 'sab', label: 'Sábado' },
  { value: 'dom', label: 'Domingo' },
] as const;

interface CaregiverProfileFormProps {
  initialData?: Partial<CaregiverProfileFormValues>;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'resubmit';
}

export function CaregiverProfileForm({ initialData, verificationStatus }: CaregiverProfileFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultSliderValue = typeof initialData?.service_radius_km === 'number' 
    ? [initialData.service_radius_km] 
    : (Array.isArray(initialData?.service_radius_km) && typeof initialData.service_radius_km[0] === 'number'
      ? [initialData.service_radius_km[0]]
      : [10]);

  const form = useForm<CaregiverProfileFormValues>({
    resolver: zodResolver(caregiverProfileSchema),
    defaultValues: {
      bio: initialData?.bio || '',
      specialties: initialData?.specialties || [],
      hourly_rate: initialData?.hourly_rate || undefined,
      city: initialData?.city || '',
      neighborhood: initialData?.neighborhood || '',
      service_radius_km: defaultSliderValue,
      available_days: initialData?.available_days || [],
      available_shifts: initialData?.available_shifts || [],
    },
  })

  async function onSubmit(data: CaregiverProfileFormValues) {
    setIsSubmitting(true)
    
    const result = await updateCaregiverProfile(data)
    
    setIsSubmitting(false)

    if (result.success) {
      toast.success('Perfil atualizado com sucesso!')
      router.refresh()
    } else {
      toast.error(result.error || 'Ocorreu um erro ao atualizar o perfil.')
    }
  }

  const toggleTag = (field: { value: string[]; onChange: (val: string[]) => void }, value: string) => {
    const current = new Set(field.value)
    if (current.has(value)) {
      current.delete(value)
    } else {
      current.add(value)
    }
    field.onChange(Array.from(current))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Status Alert if not verified */}
        {verificationStatus !== 'approved' && (
          <div className="bg-accent/15 border border-accent/20 rounded-lg p-4 flex gap-3 text-sm text-foreground items-start">
            <Info className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Seu perfil não ficará visível publicamente ainda.</p>
              <p className="text-muted-foreground">
                Você deve completar o painel e passar pelo processo de Verificação de Identidade (upload de documentos e selfie) para aparecer nas buscas de famílias.
              </p>
            </div>
          </div>
        )}

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Profissionais</CardTitle>
            <CardDescription>Como as famílias vão te encontrar e te conhecer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade de Atuação</FormLabel>
                    <FormControl>
                      <Input placeholder="Sua cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro/Região (Principal)</FormLabel>
                    <FormControl>
                      <Input placeholder="Qual bairro você costuma focar?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="service_radius_km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raio de Atendimento (km): {Array.isArray(field.value) ? field.value[0] : 10}km</FormLabel>
                  <FormControl>
                    <div className="py-4">
                      <Slider 
                        defaultValue={Array.isArray(field.value) ? field.value : [10]}
                        max={50}
                        min={1}
                        step={1}
                        onValueChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Distância máxima que você está disposto(a) a se deslocar a partir do seu bairro.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourly_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor por Hora (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 25.00"
                      step="0.01"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        field.onChange(v === '' ? undefined : Number(v))
                      }}
                    />
                  </FormControl>
                  <FormDescription>As famílias verão este valor como referência ao fechar negócio com você.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Breve Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Conte um pouco sobre sua experiência, valores e forma de cuidar..."
                      className="resize-none h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Máximo 500 caracteres. Uma boa bio aumenta as chances de match.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Especialidades e Disponibilidade */}
        <Card>
          <CardHeader>
            <CardTitle>Especialidades e Disponibilidade</CardTitle>
            <CardDescription>Defina com o que você sabe lidar e quando pode trabalhar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidades / Habilidades</FormLabel>
                  <FormDescription>Selecione todas que se aplicam à sua experiência.</FormDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CARE_TAGS.map((tag) => {
                      const isSelected = field.value.includes(tag.value)
                      return (
                        <Badge
                          key={tag.value}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer text-sm py-1.5 px-3 transition-all hover:bg-primary/90"
                          onClick={() => toggleTag(field, tag.value)}
                        >
                          {isSelected && <PlusCircle className="mr-1 h-3 w-3 rotate-45 transition-transform" />}
                          {!isSelected && <PlusCircle className="mr-1 h-3 w-3" />}
                          {tag.label}
                        </Badge>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
              <FormField
                control={form.control}
                name="available_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias da Semana (Disponibilidade Geral)</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DAYS_OF_WEEK.map((schedule) => {
                        const isSelected = field.value.includes(schedule.value)
                        return (
                          <Badge
                            key={schedule.value}
                            variant={isSelected ? "default" : "secondary"}
                            className={`cursor-pointer text-sm py-1.5 px-3 transition-all ${isSelected ? '' : 'opacity-60'}`}
                            onClick={() => toggleTag(field, schedule.value)}
                          >
                            {schedule.label}
                          </Badge>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available_shifts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turnos de Preferência</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SCHEDULES.map((schedule) => {
                        const isSelected = field.value.includes(schedule.value)
                        return (
                          <Badge
                            key={schedule.value}
                            variant={isSelected ? "default" : "secondary"}
                            className={`cursor-pointer text-sm py-1.5 px-3 transition-all ${isSelected ? '' : 'opacity-60'}`}
                            onClick={() => toggleTag(field, schedule.value)}
                          >
                            {schedule.label}
                          </Badge>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Galeria de Fotos */}
        <Card className="border-secondary/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-secondary" />
              <CardTitle>Galeria de Fotos do Perfil (Upload futuro)</CardTitle>
            </div>
            <CardDescription>
              Adicionar boas fotos transmite muita credibilidade. A implementação completa dos arquivos acontecerá isoladamente por motivos de segurança do Storage.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-32 border-2 border-dashed border-muted-foreground/20 rounded-xl flex items-center justify-center bg-muted/30">
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" /> Componente seguro de upload planejado para breve...
                </p>
             </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full text-base" disabled={isSubmitting}>
          {isSubmitting && <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />}
          Salvar Meu Perfil
        </Button>
      </form>
    </Form>
  )
}
