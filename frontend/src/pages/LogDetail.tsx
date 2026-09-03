import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteLog, getLogById } from '../services/api'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import type { Log } from '../types/api'

export default function LogDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [log, setLog] = useState<Log | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!id) {
            return
        }

        const confirmed = window.confirm(
            'Are you sure you want to delete this log?',
        )

        if (!confirmed) {
            return
        }

        try {
            setIsDeleting(true)
            setError('')

            const result = await deleteLog(id)

            if (!result.success) {
                setError('Unable to delete log.')
                return
            }

            navigate('/logs')
        } catch {
            setError('Unable to delete log.')
        } finally {
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        async function loadLog() {
            if (!id) {
                setError('Log ID is missing.')
                setIsLoading(false)
                return
            }

            try {
                setError('')

                const result = await getLogById(id)

                if (!result.success) {
                    setError('Unable to load log.')
                    return
                }

                setLog(result.data)
            } catch {
                setError('Unable to load log.')
            } finally {
                setIsLoading(false)
            }
        }

        loadLog()
    }, [id])

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-200">
                <LoadingState message="Loading log..." />
            </main>
        )
    }

    if (error || !log) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-200">
                <ErrorState message={error || 'Log not found.'} />
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-slate-200">
            <div className="mx-auto max-w-4xl">
                <div>
                    <Link
                        to="/logs"
                        className="text-sm text-slate-400 hover:text-slate-200"
                    >
                        ← Back to Logs
                    </Link>

                    <h1 className="mt-3 text-2xl font-semibold text-slate-50">
                        Log Detail
                    </h1>
                </div>

                <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
                    <div className="mb-6 flex justify-end">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-md border border-rose-800 px-3 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-950 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Log'}
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                ID
                            </p>
                            <p className="mt-1 break-all font-mono text-sm text-slate-300">
                                {log.id}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                Timestamp
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                                {new Date(log.timestamp).toLocaleString()}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                Level
                            </p>
                            <p className="mt-1 font-mono text-sm font-semibold text-slate-200">
                                {log.level}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                Message
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">
                                {log.message}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                Created At
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                                {new Date(log.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}