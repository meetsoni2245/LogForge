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

export async function getStats() {
    const token = localStorage.getItem('logforge_token')

    const to = new Date()
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)

    const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
    })

    const response = await fetch(`${API_BASE_URL}/logs/stats?${params}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

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

export async function getHourlyStats() {
    const token = localStorage.getItem('logforge_token')

    const to = new Date()
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)

    const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
    })

    const response = await fetch(
        `${API_BASE_URL}/logs/stats/hourly?${params}`,
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

export async function getLogs() {
    const token = localStorage.getItem('logforge_token')

    const response = await fetch(`${API_BASE_URL}/logs?limit=8`, {
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
        error?: {
            message: string
        }
    }>(response)
}