'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Customer,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  retrieveCurrentCustomer,
} from './auth'

export const useAuthState = () => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const c = await retrieveCurrentCustomer()
      setCustomer(c)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(
    async (email: string, password: string) => {
      await loginCustomer(email, password)
      await refresh()
    },
    [refresh]
  )

  const register = useCallback(
    async (params: {
      email: string
      password: string
      first_name: string
      last_name: string
      phone?: string
    }) => {
      await registerCustomer(params)
      await refresh()
    },
    [refresh]
  )

  const logout = useCallback(async () => {
    await logoutCustomer()
    setCustomer(null)
  }, [])

  return {
    customer,
    loading,
    isAuthenticated: !!customer,
    login,
    register,
    logout,
    refresh,
  }
}
