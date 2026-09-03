export type LogLevel = 'INFO' | 'WARN' | 'ERROR'

export interface User {
    id: string
    username: string
    createdAt: string
}

export interface Log {
    id: string
    timestamp: string
    level: LogLevel
    message: string
    createdAt: string
}

export interface AuthResponse {
    token: string
    user: User
}

export interface RegisterResponse {
    id: string
    username: string
    createdAt: string
}

export interface Stats {
    totalLogs: number
    byLevel: Record<LogLevel, number>
}

export interface HourlyStats {
    hour: string
    info: number
    warn: number
    error: number
}

export interface LogsPagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

export interface LogsResponse {
    logs: Log[]
    pagination: LogsPagination
}