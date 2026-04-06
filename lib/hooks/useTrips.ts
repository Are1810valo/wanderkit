import { useState, useEffect } from 'react'
import axios from 'axios'
import { Trip, TripItems } from '../types'

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrips()
  }, [])

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
    const res = await axios.post('/api/trips', data)
    await fetchTrips()
    return res.data.id
  }

  const updateTrip = async (id: string, data: Partial<Trip>) => {
    await axios.put(`/api/trips/${id}`, data)
    await fetchTrips()
  }

  const deleteTrip = async (id: string) => {
    await axios.delete(`/api/trips/${id}`)
    await fetchTrips()
  }

  return { trips, loading, fetchTrips, createTrip, updateTrip, deleteTrip }
}

export function useTripItems(tripId: string | null) {
  const [items, setItems] = useState<TripItems | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tripId) fetchItems()
  }, [tripId])

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
    await axios.put(`/api/${type}`, data)
    await fetchItems()
  }

  const deleteItem = async (type: string, id: string) => {
    await axios.delete(`/api/${type}?id=${id}`)
    await fetchItems()
  }

  return { items, loading, fetchItems, addItem, updateItem, deleteItem }
}