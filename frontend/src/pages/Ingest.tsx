import { useState } from 'react'
import { createBulkLogs, createLog, createRawLog } from '../services/api'

export default function Ingest() {
    const [timestamp, setTimestamp] = useState('')
    const [level, setLevel] = useState<'INFO' | 'WARN' | 'ERROR'>('INFO')
    const [message, setMessage] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [createError, setCreateError] = useState('')
    const [createSuccess, setCreateSuccess] = useState('')
    const [bulkLogs, setBulkLogs] = useState(`{
  "logs": [
    {
      "timestamp": "${new Date().toISOString()}",
      "level": "INFO",
      "message": "Example log"
    }
  ]
}`)
    const [isBulkIngesting, setIsBulkIngesting] = useState(false)
    const [bulkError, setBulkError] = useState('')
    const [bulkSuccess, setBulkSuccess] = useState('')
    const [rawLog, setRawLog] = useState('')
    const [isRawIngesting, setIsRawIngesting] = useState(false)
    const [rawError, setRawError] = useState('')
    const [rawSuccess, setRawSuccess] = useState('')

    const handleRawIngest = async () => {
        const line = rawLog.trim()

        if (!line) {
            setRawError('Raw log line is required.')
            setRawSuccess('')
            return
        }

        try {
            setIsRawIngesting(true)
            setRawError('')
            setRawSuccess('')

            const result = await createRawLog(line)

            if (!result.success) {
                setRawError(result.error?.message || 'Unable to ingest raw log.')
                return
            }

            setRawLog('')
            setRawSuccess('Raw log ingested successfully.')
        } catch {
            setRawError('Unable to ingest raw log.')
        } finally {
            setIsRawIngesting(false)
        }
    }

    const handleBulkIngest = async () => {
        try {
            const parsedData = JSON.parse(bulkLogs)

            if (
                !parsedData ||
                typeof parsedData !== 'object' ||
                !Array.isArray(parsedData.logs)
            ) {
                setBulkError('Bulk logs must contain a logs array.')
                setBulkSuccess('')
                return
            }

            setIsBulkIngesting(true)
            setBulkError('')
            setBulkSuccess('')

            const result = await createBulkLogs(parsedData.logs)

            if (!result.success) {
                setBulkError(
                    result.error?.message || 'Unable to ingest bulk logs.',
                )
                return
            }

            setBulkSuccess('Bulk logs ingested successfully.')
        } catch {
            setBulkError('Invalid JSON. Please check the bulk log data.')
            setBulkSuccess('')
        } finally {
            setIsBulkIngesting(false)
        }
    }

    const handleCreateLog = async () => {
        if (!timestamp || !message.trim()) {
            setCreateError('Timestamp and message are required.')
            setCreateSuccess('')
            return
        }

        try {
            setIsCreating(true)
            setCreateError('')
            setCreateSuccess('')

            const result = await createLog({
                timestamp: new Date(timestamp).toISOString(),
                level,
                message: message.trim(),
            })

            if (!result.success) {
                setCreateError(result.error?.message || 'Unable to create log.')
                return
            }

            setTimestamp('')
            setLevel('INFO')
            setMessage('')
            setCreateSuccess('Log created successfully.')
        } catch {
            setCreateError('Unable to create log.')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-slate-200">
            <div className="mx-auto max-w-5xl">
                <h1 className="text-2xl font-semibold text-slate-50">
                    Ingest Logs
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                    Create and ingest application logs.
                </p>

                <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
                    <h2 className="text-lg font-semibold text-slate-50">
                        Single Log
                    </h2>

                    <div className="mt-5 space-y-4">
                        <div>
                            <label
                                htmlFor="timestamp"
                                className="block text-sm font-medium text-slate-300"
                            >
                                Timestamp
                            </label>

                            <input
                                id="timestamp"
                                type="datetime-local"
                                value={timestamp}
                                onChange={(event) =>
                                    setTimestamp(event.target.value)
                                }
                                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="level"
                                className="block text-sm font-medium text-slate-300"
                            >
                                Level
                            </label>

                            <select
                                id="level"
                                value={level}
                                onChange={(event) =>
                                    setLevel(
                                        event.target.value as
                                        | 'INFO'
                                        | 'WARN'
                                        | 'ERROR',
                                    )
                                }
                                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
                            >
                                <option value="INFO">INFO</option>
                                <option value="WARN">WARN</option>
                                <option value="ERROR">ERROR</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="message"
                                className="block text-sm font-medium text-slate-300"
                            >
                                Message
                            </label>

                            <textarea
                                id="message"
                                value={message}
                                onChange={(event) =>
                                    setMessage(event.target.value)
                                }
                                rows={4}
                                placeholder="Enter log message..."
                                className="mt-2 w-full resize-y rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-slate-500"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleCreateLog}
                            disabled={isCreating}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isCreating ? 'Creating...' : 'Create Log'}
                        </button>
                        {createError && (
                            <p role="alert" className="text-sm text-rose-400">
                                {createError}
                            </p>
                        )}

                        {createSuccess && (
                            <p role="status" className="text-sm text-emerald-400">
                                {createSuccess}
                            </p>
                        )}
                    </div>
                </section>
                <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
                    <h2 className="text-lg font-semibold text-slate-50">
                        Bulk Logs
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Enter multiple logs as a JSON object containing a logs array.
                    </p>

                    <textarea
                        value={bulkLogs}
                        onChange={(event) => setBulkLogs(event.target.value)}
                        rows={14}
                        spellCheck={false}
                        className="mt-5 w-full resize-y rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-slate-500"
                    />

                    <button
                        type="button"
                        onClick={handleBulkIngest}
                        disabled={isBulkIngesting}
                        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isBulkIngesting ? 'Ingesting...' : 'Ingest Logs'}
                    </button>

                    {bulkError && (
                        <p className="mt-4 text-sm text-red-400" role="alert">
                            {bulkError}
                        </p>
                    )}

                    {bulkSuccess && (
                        <p className="mt-4 text-sm text-emerald-400" role="status">
                            {bulkSuccess}
                        </p>
                    )}
                </section>

                <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
                    <h2 className="text-lg font-semibold text-slate-50">
                        Raw Log
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Enter a raw log line to parse and ingest.
                    </p>

                    <textarea
                        value={rawLog}
                        onChange={(event) => setRawLog(event.target.value)}
                        rows={6}
                        spellCheck={false}
                        placeholder="Enter raw log line..."
                        className="mt-5 w-full resize-y rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-slate-500"
                    />

                    <button
                        type="button"
                        onClick={handleRawIngest}
                        disabled={isRawIngesting}
                        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isRawIngesting ? 'Parsing...' : 'Parse & Ingest'}
                    </button>

                    {rawError && (
                        <p className="mt-4 text-sm text-red-400" role="alert">
                            {rawError}
                        </p>
                    )}

                    {rawSuccess && (
                        <p className="mt-4 text-sm text-emerald-400" role="status">
                            {rawSuccess}
                        </p>
                    )}
                </section>
            </div>
        </main>
    )
}