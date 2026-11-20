'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PlusCircle, Info, ImagePlus } from 'lucide-react'

import { caregiverProfileSchema, type CaregiverProfileFormValues } from '@/server/validations/caregiver'
import { updateCaregiverProfile } from '@/server/actions/caregiver.actions'
import { CARE_TAGS, SCHEDULES, PROFESSIONAL_SERVICES, DRIVER_LICENSE_CATEGORIES } from '@/constants/care-tags'

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
      // Perfis criados antes do multi-serviço são cuidadores por definição.
      services: initialData?.services?.length ? initialData.services : ['care'],
      bio: initialData?.bio || '',
      specialties: initialData?.specialties || [],
      hourly_rate: initialData?.hourly_rate || undefined,
      city: initialData?.city || '',
      neighborhood: initialData?.neighborhood || '',
      service_radius_km: defaultSliderValue,
      available_days: initialData?.available_days || [],
      available_shifts: initialData?.available_shifts || [],
      vehicle_model: initialData?.vehicle_model || '',
      vehicle_year: initialData?.vehicle_year || undefined,
      vehicle_accessible: initialData?.vehicle_accessible || false,
      driver_license_category: initialData?.driver_license_category || '',
      trip_rate: initialData?.trip_rate || undefined,
    },
  })

  // Quais blocos do formulário aparecem depende das funções marcadas.
  const services = form.watch('services') || []
  const offersCare = services.includes('care')
  const offersDriving = services.includes('driving')

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
            <CardTitle>O que você oferece</CardTitle>
            <CardDescription>
              Pode marcar mais de uma. As famílias filtram a busca por isso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="services"
              render={({ field }) => (
                <FormItem>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PROFESSIONAL_SERVICES.map((service) => {
                      const isSelected = (field.value || []).includes(service.value)
                      return (
                        <button
                          key={service.value}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleTag(field, service.value)}
                          className={`text-left rounded-xl border-2 p-4 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-semibold">
                            <span
                              className={`w-4 h-4 rounded grid place-items-center border-2 ${
                                isSelected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/40'
                              }`}
                            >
                              {isSelected && <PlusCircle className="w-3 h-3 rotate-45" />}
                            </span>
                            {service.label}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1.5">{service.description}</p>
                        </button>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

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
                  <FormDescription>
                    Distância máxima que você se desloca a partir do seu bairro.
                    Vale para todos os serviços que você oferece.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {offersCare && (
            <FormField
              control={form.control}
              name="hourly_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor por Hora de cuidado (R$)</FormLabel>
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
            )}

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
        {offersDriving && (
        <Card>
          <CardHeader>
            <CardTitle>Seu veículo</CardTitle>
            <CardDescription>
              As famílias precisam saber em que o idoso vai ser transportado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="vehicle_model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo do veículo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Chevrolet Spin" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicle_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 2019"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          field.onChange(v === '' ? undefined : Number(v))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="driver_license_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria da CNH</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DRIVER_LICENSE_CATEGORIES.map((cat) => {
                        const isSelected = field.value === cat.value
                        return (
                          <Badge
                            key={cat.value}
                            render={<button type="button" />}
                            aria-pressed={isSelected}
                            variant={isSelected ? 'default' : 'outline'}
                            className="cursor-pointer text-sm py-1.5 px-3"
                            onClick={() => field.onChange(isSelected ? '' : cat.value)}
                          >
                            {cat.label}
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
                name="trip_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor por trajeto (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 40.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          field.onChange(v === '' ? undefined : Number(v))
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Preço de uma ida ou de uma volta, dentro do seu raio de atendimento.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="vehicle_accessible"
              render={({ field }) => (
                <FormItem>
                  <button
                    type="button"
                    aria-pressed={Boolean(field.value)}
                    onClick={() => field.onChange(!field.value)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      field.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <span
                        className={`w-4 h-4 rounded grid place-items-center border-2 ${
                          field.value ? 'bg-primary border-primary text-white' : 'border-muted-foreground/40'
                        }`}
                      >
                        {field.value && <PlusCircle className="w-3 h-3 rotate-45" />}
                      </span>
                      Veículo adaptado para cadeirante
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Famílias podem filtrar a busca por isso.
                    </p>
                  </button>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{offersCare ? 'Especialidades e Disponibilidade' : 'Disponibilidade'}</CardTitle>
            <CardDescription>
              {offersCare
                ? 'Defina com o que você sabe lidar e quando pode trabalhar.'
                : 'Defina quando você pode atender.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {offersCare && (
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
                          // render={<button>} mantém o estilo do Badge mas emite um
                          // <button> real: focável por teclado e anunciado como
                          // controle de alternância (antes era um <span> com onClick,
                          // invisível para leitor de tela e inalcançável por Tab).
                          render={<button type="button" />}
                          aria-pressed={isSelected}
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
            )}

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
                            render={<button type="button" />}
                            aria-pressed={isSelected}
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
                            render={<button type="button" />}
                            aria-pressed={isSelected}
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
