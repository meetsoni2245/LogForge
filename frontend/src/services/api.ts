const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export class UnauthorizedError extends Error {
    constructor() {
        super('Unauthorized')
        this.name = 'UnauthorizedError'
    }
}

async function parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
        window.dispatchEvent(new Event('logforge:unauthorized'))
        throw new UnauthorizedError()
    }

    return response.json()
}

export async function registerUser(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username,
            password,
        }),
    })

    return parseResponse<{
        success: boolean
        data: {
            id: string
            username: string
            createdAt: string
        }
        error?: {
            message: string
        }
    }>(response)
}

export async function loginUser(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username,
            password,
        }),
    })

    return parseResponse<{
        success: boolean
        data: {
            token: string
            user: {
                id: string
                username: string
                createdAt: string
            }
        }
        error?: {
            message: string
        }
    }>(response)
}

export async function getStats(params?: {
    from?: string
    to?: string
}) {
    const token = localStorage.getItem('logforge_token')
    const searchParams = new URLSearchParams()

    if (params?.from) {
        searchParams.set('from', params.from)
    }

    if (params?.to) {
        searchParams.set('to', params.to)
    }

    const query = searchParams.toString()
    const response = await fetch(
        `${API_BASE_URL}/logs/stats${query ? `?${query}` : ''}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    return parseResponse<{
        success: boolean
        data: {
            totalLogs: number
            byLevel: {
                INFO: number
                WARN: number
                ERROR: number
            }
        }
        error?: {
            message: string
        }
    }>(response)
}

export async function getHourlyStats(params?: {
    from?: string
    to?: string
}) {
    const token = localStorage.getItem('logforge_token')
    const searchParams = new URLSearchParams()

    if (params?.from) {
        searchParams.set('from', params.from)
    }

    if (params?.to) {
        searchParams.set('to', params.to)
    }

    const query = searchParams.toString()
    const response = await fetch(
        `${API_BASE_URL}/logs/stats/hourly${query ? `?${query}` : ''}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    )

    return parseResponse<{
        success: boolean
        data: {
            hour: string
            info: number
            warn: number
            error: number
        }[]
        error?: {
            message: string
        }
    }>(response)
}

export async function getLogs(params: {
    page?: number
    limit?: number
    level?: 'INFO' | 'WARN' | 'ERROR'
    search?: string
    from?: string
    to?: string
} = {}) {
    const token = localStorage.getItem('logforge_token')

    const query = new URLSearchParams()

    if (params.page !== undefined) {
        query.set('page', String(params.page))
    }

    if (params.limit !== undefined) {
        query.set('limit', String(params.limit))
    }

    if (params.level) {
        query.set('level', params.level)
    }

    if (params.search) {
        query.set('search', params.search)
    }

    if (params.from) {
        query.set('from', params.from)
    }

    if (params.to) {
        query.set('to', params.to)
    }

    const queryString = query.toString()
    const url = queryString
        ? `${API_BASE_URL}/logs?${queryString}`
        : `${API_BASE_URL}/logs`

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    return parseResponse<{
        success: boolean
        data: {
            id: string
            timestamp: string
            level: 'INFO' | 'WARN' | 'ERROR'
            message: string
            createdAt: string
        }[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
        error?: {
            message: string
        }
    }>(response)
}

export async function getLogById(id: string) {
    const token = localStorage.getItem('logforge_token')

    const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    return parseResponse<{
        success: boolean
        data: {
            id: string
            timestamp: string
            level: 'INFO' | 'WARN' | 'ERROR'
            message: string
            createdAt: string
        }
        error?: {
            message: string
        }
    }>(response)
}

export async function deleteLog(id: string) {
    const token = localStorage.getItem('logforge_token')

    const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    return parseResponse<{
        success: boolean
        data?: {
            id: string
        }
        error?: {
            message: string
        }
    }>(response)
}

export async function createLog(params: {
    timestamp: string
    level: 'INFO' | 'WARN' | 'ERROR'
    message: string
}) {
    const token = localStorage.getItem('logforge_token')

    const response = await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
    })

    return parseResponse<{
        success: boolean
        data?: {
            id: string
            timestamp: string
            level: 'INFO' | 'WARN' | 'ERROR'
            message: string
            createdAt: string
        }
        error?: {
            message: string
        }
    }>(response)
}

export async function createBulkLogs(
    logs: {
        timestamp: string
        level: 'INFO' | 'WARN' | 'ERROR'
        message: string
    }[],
) {
    const token = localStorage.getItem('logforge_token')

    const response = await fetch(`${API_BASE_URL}/logs/bulk`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ logs }),
    })

    return parseResponse<{
        success: boolean
        data?: unknown
        error?: {
            message: string
        }
    }>(response)
}

export async function createRawLog(line: string) {
    const token = localStorage.getItem('logforge_token')

    const response = await fetch(`${API_BASE_URL}/logs/raw`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ line }),
    })

    return parseResponse<{
        success: boolean
        data?: {
            id: string
            timestamp: string
            level: 'INFO' | 'WARN' | 'ERROR'
            message: string
            createdAt: string
        }
        error?: {
            message: string
        }
    }>(response)
}