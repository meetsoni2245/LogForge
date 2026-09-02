import { useEffect, useState } from 'react'
import {
    hourlyActivity as initialHourlyActivity,
    type LogLevel,
} from '../data/dashboard'
import { getHourlyStats, getLogs, getStats } from '../services/api'

const numberFormat = new Intl.NumberFormat('en-US')

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
    const [totalLogs, setTotalLogs] = useState(0)
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
    const [hourlyActivity, setHourlyActivity] = useState(initialHourlyActivity)
    const peakHourVolume = Math.max(
        ...hourlyActivity.map((h) => h.info + h.warn + h.error),
        1,
    )

    useEffect(() => {
        async function loadDashboardData() {
            const [statsResult, logsResult, hourlyResult] = await Promise.all([
                getStats(),
                getLogs(),
                getHourlyStats(),
            ])

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

                const normalizedHourlyActivity = initialHourlyActivity.map((bucket) => {
                    const matchingHour = hourlyData.find(
                        (item) => new Date(item.hour).getUTCHours() === Number(bucket.hour.slice(0, 2)),
                    )

                    return {
                        ...bucket,
                        info: matchingHour?.info ?? 0,
                        warn: matchingHour?.warn ?? 0,
                        error: matchingHour?.error ?? 0,
                    }
                })

                setHourlyActivity(normalizedHourlyActivity)
            }
        }

        loadDashboardData()
    }, [])

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
                    <span className="ml-auto font-mono text-xs text-slate-500">
                        last 24h
                    </span>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <h1 className="text-xl font-semibold text-slate-50">Overview</h1>
                <p className="mt-1.5 text-sm text-slate-400">
                    Ingestion volume and severity breakdown across your logs.
                </p>

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
                                    Hourly activity
                                </h3>
                                <span className="font-mono text-xs text-slate-500">
                                    peak {numberFormat.format(peakHourVolume)}/h
                                </span>
                            </div>

                            <ul className="mt-4 flex h-36 items-end gap-[3px] sm:gap-1.5">
                                {hourlyActivity.map((hour) => {
                                    const total = hour.info + hour.warn + hour.error
                                    return (
                                        <li
                                            key={hour.hour}
                                            className="group relative flex h-full flex-1 flex-col justify-end"
                                            title={`${hour.hour} — ${numberFormat.format(total)} logs (${numberFormat.format(hour.error)} errors)`}
                                        >
                                            <div
                                                className="w-full rounded-t-sm bg-rose-500"
                                                style={{ height: `${(hour.error / peakHourVolume) * 100}%` }}
                                            />
                                            <div
                                                className="w-full bg-amber-500"
                                                style={{ height: `${(hour.warn / peakHourVolume) * 100}%` }}
                                            />
                                            <div
                                                className="w-full bg-sky-600/70 transition-colors duration-150 ease-out group-hover:bg-sky-500"
                                                style={{ height: `${(hour.info / peakHourVolume) * 100}%` }}
                                            />
                                            <span className="sr-only">
                                                {hour.hour}: {numberFormat.format(total)} logs
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>

                            <div className="mt-2 flex justify-between font-mono text-xs text-slate-500">
                                <span>{hourlyActivity[0].hour}</span>
                                <span>12:00</span>
                                <span>{hourlyActivity[hourlyActivity.length - 1].hour}</span>
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
