'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PlusCircle, Info } from 'lucide-react'

import { elderlyProfileSchema, type ElderlyProfileFormValues } from '@/lib/validations/elderly'
import { createElderlyProfile, updateElderlyProfile } from '@/app/family/elderly/actions'
import { CARE_TAGS, SCHEDULES } from '@/constants/care-tags'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Icons } from '@/components/icons'

// Simulated file upload for now (Storage section will be handled in a dedicated module if needed)
// As specified, magic bytes validation happens on the server.

interface ElderlyProfileFormProps {
  initialData?: Partial<ElderlyProfileFormValues>;
  elderlyId?: string;
}

export function ElderlyProfileForm({ initialData, elderlyId }: ElderlyProfileFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ElderlyProfileFormValues>({
    resolver: zodResolver(elderlyProfileSchema),
    defaultValues: {
      name: initialData?.name || '',
      age: initialData?.age || undefined,
      sex: initialData?.sex || undefined,
      photo_url: initialData?.photo_url || '',
      city: initialData?.city || '',
      neighborhood: initialData?.neighborhood || '',
      care_needs: initialData?.care_needs || [],
      preferred_schedule: initialData?.preferred_schedule || [],
      observations: initialData?.observations || '',
      has_stairs: initialData?.has_stairs || false,
      has_ramp: initialData?.has_ramp || false,
      has_adapted_bathroom: initialData?.has_adapted_bathroom || false,
      has_caregiver_room: initialData?.has_caregiver_room || false,
      has_pets: initialData?.has_pets || false,
      residence_notes: initialData?.residence_notes || '',
    },
  })

  async function onSubmit(data: ElderlyProfileFormValues) {
    setIsSubmitting(true)
    
    // Call server action securely
    let result;
    if (elderlyId) {
      result = await updateElderlyProfile({ id: elderlyId, data })
    } else {
      result = await createElderlyProfile(data)
    }
    
    setIsSubmitting(false)

    if (result.success) {
      toast.success(elderlyId ? 'Perfil atualizado com sucesso!' : 'Perfil do idoso salvo com sucesso!')
      router.push('/family/dashboard')
      router.refresh()
    } else {
      toast.error(result.error || 'Ocorreu um erro ao salvar o perfil.')
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
        {/* Identificação Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Identificação Básica</CardTitle>
            <CardDescription>Informações principais sobre o idoso que precisa de cuidados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Dona Maria da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idade</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 82"
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

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-2"
                        >
                          <FormItem className="flex items-center space-x-1 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="M" />
                            </FormControl>
                            <FormLabel className="font-normal">M</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-1 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="F" />
                            </FormControl>
                            <FormLabel className="font-normal">F</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-1 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="outro" />
                            </FormControl>
                            <FormLabel className="font-normal">Outro</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
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
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu bairro" {...field} />
                    </FormControl>
                    <FormDescription>
                      Para preservar sua segurança, a localização exata não será exposta.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Necessidades e Horários */}
        <Card>
          <CardHeader>
            <CardTitle>Necessidades e Rotina</CardTitle>
            <CardDescription>O que o idoso precisa e em quais horários.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="care_needs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Necessidades de Cuidado</FormLabel>
                  <FormDescription>Selecione todas que se aplicam.</FormDescription>
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

            <FormField
              control={form.control}
              name="preferred_schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turnos de Preferência</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SCHEDULES.map((schedule) => {
                      const isSelected = field.value.includes(schedule.value)
                      return (
                        <Badge
                          key={schedule.value}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer text-sm py-1.5 px-3 transition-all"
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
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Adicionais</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes sobre a personalidade, rotina ou hobbies do idoso (opcional)"
                      className="resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Avaliação da Residência */}
        <Card className="border-secondary/30 bg-secondary/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-secondary">
              <Info className="h-5 w-5" />
              <CardTitle>Avaliação da Residência</CardTitle>
            </div>
            <CardDescription>
              Isso ajuda na precificação e na segurança do cuidador. Só fica visível para cuidadores com match confirmado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'has_stairs', label: 'Possui escadas sem elevador?' },
                { name: 'has_ramp', label: 'Residência tem rampa de acesso?' },
                { name: 'has_adapted_bathroom', label: 'Banheiro é adaptado (barras)?' },
                { name: 'has_caregiver_room', label: 'Quarto disponível para cuidador?' },
                { name: 'has_pets', label: 'Tem animais de estimação na casa?' },
              ].map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name as Extract<keyof ElderlyProfileFormValues, 'has_stairs' | 'has_ramp' | 'has_adapted_bathroom' | 'has_caregiver_room' | 'has_pets'>}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-background">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{item.label}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-readonly
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <FormField
              control={form.control}
              name="residence_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas sobre a casa</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Existem dois cachorros pequenos dóceis; o porteiro precisa interfonar antes de liberar, etc."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full text-base" disabled={isSubmitting}>
          {isSubmitting && <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />}
          Salvar Perfil do Idoso
        </Button>
      </form>
    </Form>
  )
}
