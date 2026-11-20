'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form, FormControl, FormDescription, FormField,
  FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { updateOwnProfile } from '@/server/actions/profile.actions'
import { profileSchema, type ProfileFormValues } from '@/server/validations/profile'

const BIO_MAX = 280

export function ProfileForm({ initialData }: { initialData: ProfileFormValues }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialData.full_name ?? '',
      phone: initialData.phone ?? '',
      bio_short: initialData.bio_short ?? '',
    },
  })

  const bioLength = form.watch('bio_short')?.length ?? 0
  const isDirty = form.formState.isDirty

  function onSubmit(values: ProfileFormValues) {
    const toastId = toast.loading('Salvando…')

    startTransition(async () => {
      const res = await updateOwnProfile(values)
      if (res.success) {
        toast.success('Alterações salvas.', { id: toastId })
        // Reseta o "dirty" para o estado recém-salvo.
        form.reset(values)
        router.refresh()
      } else {
        toast.error(res.error || 'Não foi possível salvar.', { id: toastId })
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome" autoComplete="name" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 98800-0000" autoComplete="tel" className="h-11" {...field} />
                </FormControl>
                <FormDescription>Visível só depois que um match é aceito.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bio_short"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Sobre você</FormLabel>
                <span
                  className={
                    bioLength > BIO_MAX
                      ? 'text-xs font-medium text-destructive'
                      : 'text-xs text-muted-foreground'
                  }
                >
                  {bioLength}/{BIO_MAX}
                </span>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Uma linha sobre você (opcional)"
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          {isDirty && !isPending && (
            <span className="text-xs text-muted-foreground">Você tem alterações não salvas.</span>
          )}
          <Button type="submit" disabled={isPending || !isDirty} className="mt-4">
            {isPending ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
