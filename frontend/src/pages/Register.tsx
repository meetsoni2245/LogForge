import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { registerUser } from '../services/api'

function Register() {
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')

        const formData = new FormData(event.currentTarget)
        const username = String(formData.get('username') ?? '').trim()
        const password = String(formData.get('password') ?? '')
        const confirmPassword = String(formData.get('confirmPassword') ?? '')

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setIsSubmitting(true)

        try {
            const result = await registerUser(username, password)

            if (!result.success) {
                setError(result.error?.message ?? 'Registration failed.')
                return
            }

            window.location.href = '/login'
        } catch {
            setError('Unable to connect to the server.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 py-10">
            <div className="w-full max-w-sm">
                <div className="mb-8 flex items-center gap-2.5">
                    <span
                        aria-hidden="true"
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 font-mono text-sm font-bold text-white"
                    >
                        L
                    </span>
                    <span className="font-mono text-lg font-semibold tracking-tight text-slate-50">
                        LogForge
                    </span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 sm:p-7">
                    <h1 className="text-xl font-semibold text-slate-50">
                        Create account
                    </h1>
                    <p className="mt-1.5 text-sm text-slate-400">
                        Create your LogForge account.
                    </p>

                    <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                placeholder="you@logforge"
                                className="mt-1.5 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 transition-colors duration-150 ease-out focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                aria-describedby="password-hint"
                                className="mt-1.5 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 transition-colors duration-150 ease-out focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <p id="password-hint" className="mt-1.5 text-xs text-slate-500">
                                At least 8 characters.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300">
                                Confirm password
                            </label>
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1.5 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 transition-colors duration-150 ease-out focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        {error && (
                            <p role="alert" className="text-sm text-red-400">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>
                </div>

                <p className="mt-5 text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-medium text-blue-400 transition-colors duration-150 ease-out hover:text-blue-300 focus:outline-none focus-visible:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    )
}

export default Register