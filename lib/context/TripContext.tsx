'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

interface TripContextType {
  items: any
  loading: boolean
  userRole: 'owner'|'escritor'|'lector'
  refetch: () => Promise<void>
  addItem: (type: string, data: any) => Promise<void>
  updateItem: (type: string, data: any) => Promise<void>
  deleteItem: (type: string, id: string) => Promise<void>
}

const TripContext = createContext<TripContextType | null>(null)

export function useTripContext() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTripContext must be used inside TripProvider')
  return ctx
}

export function TripProvider({ tripId, children, userRole = 'owner' }: { tripId: string; children: React.ReactNode; userRole?: 'owner'|'escritor'|'lector' }) {
  const [items, setItems] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const cache = useRef<any>(null)
  const lastFetch = useRef<number>(0)
  const TTL = 30_000

  const fetchItems = useCallback(async (force = false) => {
    if (!tripId) return
    const now = Date.now()
    if (!force && cache.current && now - lastFetch.current < TTL) {
      setItems(cache.current)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await axios.get(`/api/trips/${tripId}/items`)
      cache.current = res.data
      lastFetch.current = now
      setItems(res.data)
    } catch (e) {
      console.error('Error fetching items', e)
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => { if (tripId) fetchItems() }, [fetchItems, tripId])

  const addItem = useCallback(async (type: string, data: any) => {
    await axios.post(`/api/${type}`, { ...data, tripId })
    await fetchItems(true)
  }, [tripId, fetchItems])

  const updateItem = useCallback(async (type: string, data: any) => {
    if (cache.current) {
      const key = type as keyof typeof cache.current
      const updated = {
        ...cache.current,
        [key]: Array.isArray(cache.current[key])
          ? cache.current[key].map((i: any) => i.id === data.id ? { ...i, ...data } : i)
          : cache.current[key]
      }
      cache.current = updated
      setItems(updated)
    }
    try {
      await axios.put(`/api/${type}`, data)
    } catch (e) {
      await fetchItems(true)
      throw e
    }
  }, [fetchItems])

  const deleteItem = useCallback(async (type: string, id: string) => {
    if (cache.current) {
      const key = type as keyof typeof cache.current
      const updated = {
        ...cache.current,
        [key]: Array.isArray(cache.current[key])
          ? cache.current[key].filter((i: any) => i.id !== id)
          : cache.current[key]
      }
      cache.current = updated
      setItems(updated)
    }
    try {
      await axios.delete(`/api/${type}?id=${id}`)
    } catch (e) {
      await fetchItems(true)
      throw e
    }
  }, [fetchItems])

  return (
    <TripContext.Provider value={{ items, loading, userRole, refetch: () => fetchItems(true), addItem, updateItem, deleteItem }}>
      {children}
    </TripContext.Provider>
  )
}