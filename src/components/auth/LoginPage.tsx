import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { friendlyAuthError } from '@/firebase/auth'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { Input } from '@/components/common/Input'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type Values = z.infer<typeof schema>

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  // Already signed in — bounce straight to where they were headed (or the dashboard).
  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
    return <Navigate to={from} replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values.email, values.password)
    } catch (error) {
      setFormError(friendlyAuthError(error))
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-bold tracking-tight text-ink">Brisque Ops</h1>
          <p className="mt-1 text-sm text-sub">Sign in to the operations console</p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="app-card space-y-4 p-6">
          <FormField label="Email" htmlFor="login-email" required error={errors.email?.message}>
            <Input
              id="login-email"
              type="email"
              autoComplete="username"
              invalid={!!errors.email}
              {...register('email')}
            />
          </FormField>
          <FormField label="Password" htmlFor="login-password" required error={errors.password?.message}>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              invalid={!!errors.password}
              {...register('password')}
            />
          </FormField>

          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full justify-center" disabled={isSubmitting}>
            <LogIn className="h-3.5 w-3.5" aria-hidden />
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
