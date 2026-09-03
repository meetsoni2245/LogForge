import { useEffect, useState } from 'react'
import { getLogs } from '../services/api'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import type { Log } from '../types/api'
import { Link } from 'react-router-dom'

export default function Logs() {
    const [logs, setLogs] = useState<Log[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [level, setLevel] = useState<'INFO' | 'WARN' | 'ERROR' | undefined>(
        undefined,
    )
    const [search, setSearch] = useState('')
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')

    useEffect(() => {
        async function loadLogs() {
            try {
                setError('')

                const result = await getLogs({
                    page,
                    limit: pageSize,
                    level,
                    search: search || undefined,
                    from: from ? new Date(from).toISOString() : undefined,
                    to: to ? new Date(to).toISOString() : undefined,
                })

                if (!result.success) {
                    setError('Unable to load logs.')
                    return
                }

                setLogs(result.data)
                setTotalPages(result.pagination.totalPages)
            } catch {
                setError('Unable to load logs.')
            } finally {
                setIsLoading(false)
            }
        }

        loadLogs()
    }, [page, level, search, from, to, pageSize])

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-200">
                <LoadingState message="Loading logs..." />
            </main>
        )
    }

    if (error) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-200">
                <ErrorState message={error} />
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-slate-200">
            <div className="mx-auto max-w-6xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-50">Logs</h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Browse your application logs.
                        </p>
                    </div>

                    <Link
                        to="/dashboard"
                        className="text-sm text-slate-400 hover:text-slate-200"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value)
                            setPage(1)
                        }}
                        placeholder="Search messages..."
                        className="w-full max-w-sm rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-slate-500"
                    />

                    <select
                        value={level ?? ''}
                        onChange={(event) => {
                            setLevel(
                                event.target.value === ''
                                    ? undefined
                                    : (event.target.value as 'INFO' | 'WARN' | 'ERROR'),
                            )
                            setPage(1)
                        }}
                        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
                    >
                        <option value="">All levels</option>
                        <option value="INFO">INFO</option>
                        <option value="WARN">WARN</option>
                        <option value="ERROR">ERROR</option>
                    </select>

                    <input
                        type="datetime-local"
                        value={from}
                        onChange={(event) => {
                            setFrom(event.target.value)
                            setPage(1)
                        }}
                        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
                    />

                    <input
                        type="datetime-local"
                        value={to}
                        onChange={(event) => {
                            setTo(event.target.value)
                            setPage(1)
                        }}
                        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
                    />
                    <select
                        value={pageSize}
                        onChange={(event) => {
                            setPageSize(Number(event.target.value))
                            setPage(1)
                        }}
                        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
                    >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </select>
                </div>

                <div className="mt-6 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left">
                            <thead className="border-b border-slate-800 bg-slate-950/50">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Timestamp
                                    </th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Level
                                    </th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Message
                                    </th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-4 py-12 text-center text-sm text-slate-500"
                                        >
                                            No logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="transition-colors hover:bg-slate-800/50"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={
                                                        log.level === 'ERROR'
                                                            ? 'font-mono text-xs font-semibold text-rose-400'
                                                            : log.level === 'WARN'
                                                                ? 'font-mono text-xs font-semibold text-amber-400'
                                                                : 'font-mono text-xs font-semibold text-sky-400'
                                                    }
                                                >
                                                    {log.level}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-200">
                                                {log.message}
                                            </td>

                                            <td className="px-4 py-3">
                                                <Link
                                                    to={`/logs/${log.id}`}
                                                    className="text-sm text-slate-400 hover:text-slate-200 hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => {
                            setIsLoading(true)
                            setPage((currentPage) => currentPage - 1)
                        }}
                        disabled={page === 1}
                        className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Previous
                    </button>

                    <span className="text-sm text-slate-400">
                        Page {page} of {totalPages}
                    </span>

                    <button
                        type="button"
                        onClick={() => {
                            setIsLoading(true)
                            setPage((currentPage) => currentPage + 1)
                        }}
                        disabled={page >= totalPages}
                        className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>
        </main>
    )
}