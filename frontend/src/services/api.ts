const API_BASE_URL = 'http://localhost:3000/api'

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

    return response.json()
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

    return response.json()
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

    return response.json()
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

    return response.json()
}

export async function getLogs() {
    const token = localStorage.getItem('logforge_token')

    const response = await fetch(`${API_BASE_URL}/logs?limit=8`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    return response.json()
}