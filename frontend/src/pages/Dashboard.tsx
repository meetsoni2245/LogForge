import { useEffect, useRef, useState } from 'react'
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import LoadingState from '../components/LoadingState'
import type { LogLevel } from '../types/api'
import { getHourlyStats, getLogs, getStats, UnauthorizedError } from '../services/api'
import ErrorState from '../components/ErrorState'
import { useAuth } from '../hooks/useAuthHook'
import { Link } from 'react-router-dom'

const numberFormat = new Intl.NumberFormat('en-US')
type DateRangePreset = '24h' | '7d' | '30d' | 'custom'

const dateRangeLabels: Record<DateRangePreset, string> = {
    '24h': 'Last 24 hours',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    custom: 'Custom range',
}

function getDateRange(
    preset: DateRangePreset,
    customFrom?: string,
    customTo?: string,
) {
    const to = new Date()

    if (preset === 'custom') {
        return {
            from: customFrom ? new Date(customFrom).toISOString() : undefined,
            to: customTo ? new Date(customTo).toISOString() : undefined,
        }
    }

    const durations: Record<Exclude<DateRangePreset, 'custom'>, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
    }

    return {
        from: new Date(to.getTime() - durations[preset]).toISOString(),
        to: to.toISOString(),
    }
}
const hourFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
})

function formatHourLabel(value: string): string {
    return hourFormat.format(new Date(value))
}

const levelStyles: Record<LogLevel, { text: string; bar: string; badge: string }> = {
    INFO: {
        text: 'text-sky-300',
        bar: 'bg-sky-500',
        badge: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    },
    WARN: {
        text: 'text-amber-300',
        bar: 'bg-amber-500',
        badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    },
    ERROR: {
        text: 'text-rose-300',
        bar: 'bg-rose-500',
        badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    },
}



export default function Dashboard() {
    const requestIdRef = useRef(0)
    const [totalLogs, setTotalLogs] = useState(0)
    const [dateRange, setDateRange] = useState<DateRangePreset>('24h')
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState('')
    const [appliedCustomFrom, setAppliedCustomFrom] = useState('')
    const [appliedCustomTo, setAppliedCustomTo] = useState('')
    const [levelCounts, setLevelCounts] = useState<
        { level: LogLevel; count: number }[]
    >([])
    const [logs, setLogs] = useState<
        {
            id: string
            timestamp: string
            level: LogLevel
            message: string
            createdAt: string
        }[]
    >([])
    const [hourlyActivity, setHourlyActivity] = useState<
        { hour: string; info: number; warn: number; error: number }[]
    >([])
    const peakHourVolume = Math.max(
        ...hourlyActivity.map((h) => h.info + h.warn + h.error),
        1,
    )
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [customRangeError, setCustomRangeError] = useState('')
    const { user, logout } = useAuth()

    useEffect(() => {
        async function loadDashboardData() {
            const requestId = ++requestIdRef.current
            setCustomRangeError('')

            if (dateRange === 'custom') {
                if (!customFrom || !customTo) {
                    setCustomRangeError('Please select both a From date and a To date.')
                    setIsLoading(false)
                    return
                }

                const from = new Date(customFrom)
                const to = new Date(customTo)

                if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
                    setCustomRangeError('Please enter valid dates.')
                    setIsLoading(false)
                    return
                }

                if (from > to) {
                    setCustomRangeError(
                        'The From date must be earlier than or equal to the To date.',
                    )
                    setIsLoading(false)
                    return
                }
            }

            const range = getDateRange(
                dateRange,
                dateRange === 'custom' ? appliedCustomFrom : customFrom,
                dateRange === 'custom' ? appliedCustomTo : customTo,
            )

            try {
                setError('')
                setIsLoading(true)
                const [statsResult, logsResult, hourlyResult] = await Promise.all([
                    getStats(range),
                    getLogs({
                        from: range.from,
                        to: range.to,
                    }),
                    getHourlyStats(range),
                ])
                if (requestId !== requestIdRef.current) {
                    return
                }

                if (statsResult.success) {
                    setTotalLogs(statsResult.data.totalLogs)
                    setLevelCounts(
                        (Object.entries(statsResult.data.byLevel) as [LogLevel, number][])
                            .map(([level, count]) => ({ level, count })),
                    )
                }

                if (logsResult.success) {
                    setLogs(logsResult.data)
                }

                if (hourlyResult.success) {
                    const hourlyData: {
                        hour: string
                        info: number
                        warn: number
                        error: number
                    }[] = hourlyResult.data

                    setHourlyActivity(hourlyData)
                }
                if (!statsResult.success || !logsResult.success || !hourlyResult.success) {
                    setError('Unable to load dashboard data.')
                    return
                }
            } catch (error) {
                if (error instanceof UnauthorizedError) {
                    return
                }

                setError('Unable to load dashboard data.')
            } finally {
                setIsLoading(false)
            }
        }

        loadDashboardData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, appliedCustomFrom, appliedCustomTo])

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-slate-950 text-slate-200">
                <LoadingState message="Loading dashboard..." />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen w-full bg-slate-950 text-slate-200">
                <ErrorState message={error} />
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-200">
            <header className="border-b border-slate-800">
                <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-4 sm:px-6">
                    <span
                        aria-hidden="true"
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 font-mono text-sm font-bold text-white"
                    >
                        L
                    </span>
                    <span className="font-mono text-lg font-semibold tracking-tight text-slate-50">
                        LogForge
                    </span>
                    <div className="ml-auto flex items-center gap-4">
                        <Link
                            to="/logs"
                            className="rounded-md px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                        >
                            Logs
                        </Link>
                        <span className="hidden text-sm text-slate-400 sm:inline">
                            {user?.username}
                        </span>

                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors duration-150 ease-out hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <h1 className="text-xl font-semibold text-slate-50">Overview</h1>
                <p className="mt-1.5 text-sm text-slate-400">
                    Ingestion volume and severity breakdown across your logs.
                </p>
                <div className="mt-4 flex flex-wrap items-end gap-2">
                    {(Object.keys(dateRangeLabels) as DateRangePreset[]).map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => setDateRange(preset)}
                            className={`rounded-md px-3 py-2 text-sm font-medium transition ${dateRange === preset
                                ? 'bg-sky-500 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            {dateRangeLabels[preset]}
                        </button>
                    ))}

                    {dateRange === 'custom' && (
                        <>
                            <label className="flex flex-col gap-1 text-xs text-slate-400">
                                From
                                <input
                                    type="datetime-local"
                                    value={customFrom}
                                    onChange={(event) => setCustomFrom(event.target.value)}
                                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500"
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-xs text-slate-400">
                                To
                                <input
                                    type="datetime-local"
                                    value={customTo}
                                    onChange={(event) => setCustomTo(event.target.value)}
                                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500"
                                />
                            </label>
                            {customRangeError && (
                                <p className="w-full text-xs text-rose-400">
                                    {customRangeError}
                                </p>
                            )}
                        </>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setAppliedCustomFrom(customFrom)
                            setAppliedCustomTo(customTo)
                        }}
                        className="rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
                    >
                        Apply
                    </button>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <section
                        aria-labelledby="volume-heading"
                        className="rounded-lg border border-slate-800 bg-slate-900 p-6 lg:col-span-2"
                    >
                        <h2
                            id="volume-heading"
                            className="text-sm font-medium text-slate-400"
                        >
                            Total logs
                        </h2>
                        <p className="mt-2 font-mono text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
                            {numberFormat.format(totalLogs)}
                        </p>

                        <div className="mt-8">
                            <div className="flex items-baseline justify-between">
                                <h3 className="text-sm font-medium text-slate-300">
                                    Log activity
                                </h3>
                                <span className="font-mono text-xs text-slate-500">
                                    peak {numberFormat.format(peakHourVolume)}/h
                                </span>
                            </div>

                            <div className="mt-4 h-64 w-full">
                                {hourlyActivity.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                        No activity in this range.
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={hourlyActivity}
                                            margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="rgb(51 65 85 / 0.5)"
                                            />
                                            <XAxis
                                                dataKey="hour"
                                                tickFormatter={formatHourLabel}
                                                tick={{ fill: 'rgb(100 116 139)', fontSize: 11 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tick={{ fill: 'rgb(100 116 139)', fontSize: 11 }}
                                                tickLine={false}
                                                axisLine={false}
                                                width={48}
                                            />
                                            <Tooltip
                                                labelFormatter={(label) => formatHourLabel(String(label))}
                                                contentStyle={{
                                                    backgroundColor: 'rgb(15 23 42)',
                                                    border: '1px solid rgb(51 65 85)',
                                                    borderRadius: '6px',
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="info"
                                                name="INFO"
                                                stroke="rgb(14 165 233)"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="warn"
                                                name="WARN"
                                                stroke="rgb(245 158 11)"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="error"
                                                name="ERROR"
                                                stroke="rgb(244 63 94)"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </section>

                    <section
                        aria-labelledby="levels-heading"
                        className="rounded-lg border border-slate-800 bg-slate-900 p-6"
                    >
                        <h2
                            id="levels-heading"
                            className="text-sm font-medium text-slate-400"
                        >
                            By severity
                        </h2>
                        <ul className="mt-4 divide-y divide-slate-800">
                            {levelCounts.map(({ level, count }) => {
                                const share = totalLogs > 0 ? (count / totalLogs) * 100 : 0
                                return (
                                    <li key={level} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span
                                                className={`font-mono text-xs font-semibold tracking-wide ${levelStyles[level].text}`}
                                            >
                                                {level}
                                            </span>
                                            <span className="font-mono text-lg font-semibold text-slate-100">
                                                {numberFormat.format(count)}
                                            </span>
                                        </div>
                                        <div
                                            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
                                            role="img"
                                            aria-label={`${level} is ${share.toFixed(1)}% of all logs`}
                                        >
                                            <div
                                                className={`h-full rounded-full ${levelStyles[level].bar}`}
                                                style={{ width: `${Math.max(share, 1)}%` }}
                                            />
                                        </div>
                                        <p className="mt-1.5 font-mono text-xs text-slate-500">
                                            {share.toFixed(1)}% of volume
                                        </p>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>
                </div>

                <section aria-labelledby="recent-heading" className="mt-4">
                    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                        <div className="flex items-baseline justify-between gap-3 border-b border-slate-800 px-6 py-4">
                            <h2
                                id="recent-heading"
                                className="text-sm font-medium text-slate-300"
                            >
                                Recent logs
                            </h2>
                            <span className="font-mono text-xs text-slate-500">
                                {logs.length} of {numberFormat.format(totalLogs)}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] border-collapse text-left">
                                <caption className="sr-only">
                                    The most recent log entries across all services
                                </caption>
                                <thead>
                                    <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                                        <th scope="col" className="px-6 py-2.5 font-medium">
                                            Timestamp
                                        </th>
                                        <th scope="col" className="px-3 py-2.5 font-medium">
                                            Level
                                        </th>
                                        <th scope="col" className="px-6 py-2.5 font-medium">
                                            Message
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/70">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="align-top">
                                            <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-500">
                                                {log.timestamp}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span
                                                    className={`inline-flex rounded border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${levelStyles[log.level].badge}`}
                                                >
                                                    {log.level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-slate-200">
                                                {log.message}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
