import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types/api'

interface AuthContextValue {
    token: string | null
    user: User | null
    isAuthenticated: boolean
    login: (token: string, user: User) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getStoredUser(): User | null {
    const storedUser = localStorage.getItem('logforge_user')

    if (!storedUser) {
        return null
    }

    try {
        return JSON.parse(storedUser) as User
    } catch {
        return null
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(
        localStorage.getItem('logforge_token'),
    )
    const [user, setUser] = useState<User | null>(getStoredUser)

    useEffect(() => {
        const handleUnauthorized = () => {
            localStorage.removeItem('logforge_token')
            localStorage.removeItem('logforge_user')
            setToken(null)
            setUser(null)
        }

        window.addEventListener('logforge:unauthorized', handleUnauthorized)

        return () => {
            window.removeEventListener(
                'logforge:unauthorized',
                handleUnauthorized,
            )
        }
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            token,
            user,
            isAuthenticated: Boolean(token),
            login: (newToken, newUser) => {
                localStorage.setItem('logforge_token', newToken)
                localStorage.setItem('logforge_user', JSON.stringify(newUser))
                setToken(newToken)
                setUser(newUser)
            },
            logout: () => {
                localStorage.removeItem('logforge_token')
                localStorage.removeItem('logforge_user')
                setToken(null)
                setUser(null)
            },
        }),
        [token, user],
    )

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}