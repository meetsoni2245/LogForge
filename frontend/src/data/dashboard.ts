export type LogLevel = 'INFO' | 'WARN' | 'ERROR'

export interface LogEntry {
    id: string
    timestamp: string
    level: LogLevel
    service: string
    message: string
}

export const totalLogs = 1284932

export const levelCounts: { level: LogLevel; count: number }[] = [
    { level: 'INFO', count: 1187540 },
    { level: 'WARN', count: 82461 },
    { level: 'ERROR', count: 14931 },
]

/** Volume per hour over the last 24 hours, oldest first. */
export const hourlyActivity: { hour: string; info: number; warn: number; error: number }[] = [
    { hour: '00:00', info: 3120, warn: 210, error: 24 },
    { hour: '01:00', info: 2740, warn: 184, error: 18 },
    { hour: '02:00', info: 2380, warn: 151, error: 12 },
    { hour: '03:00', info: 2115, warn: 132, error: 9 },
    { hour: '04:00', info: 2260, warn: 148, error: 14 },
    { hour: '05:00', info: 2890, warn: 176, error: 21 },
    { hour: '06:00', info: 3640, warn: 232, error: 26 },
    { hour: '07:00', info: 4480, warn: 301, error: 33 },
    { hour: '08:00', info: 5310, warn: 366, error: 41 },
    { hour: '09:00', info: 6120, warn: 428, error: 52 },
    { hour: '10:00', info: 6480, warn: 455, error: 61 },
    { hour: '11:00', info: 6240, warn: 441, error: 58 },
    { hour: '12:00', info: 5870, warn: 402, error: 47 },
    { hour: '13:00', info: 6010, warn: 418, error: 55 },
    { hour: '14:00', info: 6390, warn: 462, error: 88 },
    { hour: '15:00', info: 6710, warn: 498, error: 134 },
    { hour: '16:00', info: 6320, warn: 471, error: 96 },
    { hour: '17:00', info: 5740, warn: 398, error: 63 },
    { hour: '18:00', info: 5020, warn: 341, error: 44 },
    { hour: '19:00', info: 4460, warn: 296, error: 38 },
    { hour: '20:00', info: 4180, warn: 271, error: 31 },
    { hour: '21:00', info: 3910, warn: 254, error: 29 },
    { hour: '22:00', info: 3540, warn: 238, error: 25 },
    { hour: '23:00', info: 3260, warn: 219, error: 22 },
]

export const recentLogs: LogEntry[] = [
    {
        id: 'lg_9f21a4',
        timestamp: '2026-09-02 15:42:08',
        level: 'ERROR',
        service: 'api-gateway',
        message: 'Upstream timeout after 30000ms calling billing-service /v1/invoices',
    },
    {
        id: 'lg_9f21a3',
        timestamp: '2026-09-02 15:41:57',
        level: 'WARN',
        service: 'billing-service',
        message: 'Connection pool at 92% capacity (46/50), queueing requests',
    },
    {
        id: 'lg_9f21a2',
        timestamp: '2026-09-02 15:41:44',
        level: 'INFO',
        service: 'ingest-worker',
        message: 'Flushed batch of 5000 events to primary index in 812ms',
    },
    {
        id: 'lg_9f21a1',
        timestamp: '2026-09-02 15:41:31',
        level: 'ERROR',
        service: 'auth-service',
        message: 'JWT signature verification failed for key id sig-2026-08 (rotated)',
    },
    {
        id: 'lg_9f21a0',
        timestamp: '2026-09-02 15:41:12',
        level: 'INFO',
        service: 'api-gateway',
        message: 'GET /v1/logs?level=ERROR&limit=100 completed with 200 in 124ms',
    },
    {
        id: 'lg_9f219f',
        timestamp: '2026-09-02 15:40:55',
        level: 'WARN',
        service: 'ingest-worker',
        message: 'Dropped 12 malformed events from source edge-eu-west-1',
    },
    {
        id: 'lg_9f219e',
        timestamp: '2026-09-02 15:40:39',
        level: 'INFO',
        service: 'scheduler',
        message: 'Retention job completed: 2.4 GB pruned from cold storage',
    },
    {
        id: 'lg_9f219d',
        timestamp: '2026-09-02 15:40:21',
        level: 'INFO',
        service: 'auth-service',
        message: 'Issued access token for user devops@logforge (ttl 3600s)',
    },
]
