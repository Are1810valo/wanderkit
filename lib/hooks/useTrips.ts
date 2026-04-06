import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Trip, TripItems } from '../types'

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTrips() }, [])

  const fetchTrips = async () => {
    try {
      const res = await axios.get('/api/trips')
      setTrips(res.data)
    } catch (error) {
      console.error('Error al obtener viajes', error)
    } finally {
      setLoading(false)
    }
  }

  const createTrip = async (data: Partial<Trip>) => {
    // Optimistic: agregar viaje temporal inmediatamente
    const tempId = 'temp_' + Date.now()
    const tempTrip = { id: tempId, ...data, created_at: new Date().toISOString() } as Trip
    setTrips(prev => [tempTrip, ...prev])
    try {
      const res = await axios.post('/api/trips', data)
      // Reemplazar el temporal con el real
      setTrips(prev => prev.map(t => t.id === tempId ? { ...tempTrip, id: res.data.id } : t))
      return res.data.id
    } catch (error) {
      // Revertir si falla
      setTrips(prev => prev.filter(t => t.id !== tempId))
      throw error
    }
  }

  const updateTrip = async (id: string, data: Partial<Trip>) => {
    // Optimistic: actualizar inmediatamente
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    try {
      await axios.put(`/api/trips/${id}`, data)
    } catch (error) {
      // Revertir si falla
      fetchTrips()
      throw error
    }
  }

  const deleteTrip = async (id: string) => {
    // Optimistic: eliminar inmediatamente
    setTrips(prev => prev.filter(t => t.id !== id))
    try {
      await axios.delete(`/api/trips/${id}`)
    } catch (error) {
      fetchTrips()
      throw error
    }
  }

  const deleteTrips = async (ids: string[]) => {
    // Optimistic: eliminar todos inmediatamente
    setTrips(prev => prev.filter(t => !ids.includes(t.id)))
    try {
      await Promise.all(ids.map(id => axios.delete(`/api/trips/${id}`)))
    } catch (error) {
      fetchTrips()
      throw error
    }
  }

  return { trips, loading, fetchTrips, createTrip, updateTrip, deleteTrip, deleteTrips }
}

export function useTripItems(tripId: string | null) {
  const [items, setItems] = useState<TripItems | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (tripId) fetchItems() }, [tripId])

  const fetchItems = async () => {
    if (!tripId) return
    setLoading(true)
    try {
      const res = await axios.get(`/api/trips/${tripId}/items`)
      setItems(res.data)
    } catch (error) {
      console.error('Error al obtener items', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (type: string, data: any) => {
    await axios.post(`/api/${type}`, { ...data, tripId })
    await fetchItems()
  }

  const updateItem = async (type: string, data: any) => {
    // Optimistic update para items
    if (items) {
      const key = type as keyof TripItems
      setItems(prev => prev ? {
        ...prev,
        [key]: Array.isArray(prev[key])
          ? (prev[key] as any[]).map((i: any) => i.id === data.id ? { ...i, ...data } : i)
          : prev[key]
      } : prev)
    }
    try {
      await axios.put(`/api/${type}`, data)
    } catch (error) {
      fetchItems()
      throw error
    }
  }

  const deleteItem = async (type: string, id: string) => {
    // Optimistic delete para items
    if (items) {
      const key = type as keyof TripItems
      setItems(prev => prev ? {
        ...prev,
        [key]: Array.isArray(prev[key])
          ? (prev[key] as any[]).filter((i: any) => i.id !== id)
          : prev[key]
      } : prev)
    }
    try {
      await axios.delete(`/api/${type}?id=${id}`)
    } catch (error) {
      fetchItems()
      throw error
    }
  }

  return { items, loading, fetchItems, addItem, updateItem, deleteItem }
}