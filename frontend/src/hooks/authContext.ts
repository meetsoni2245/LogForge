import { createContext } from 'react'
import type { User } from '../types/api'

export interface AuthContextValue {
    token: string | null
    user: User | null
    isAuthenticated: boolean
    login: (token: string, user: User) => void
    logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)