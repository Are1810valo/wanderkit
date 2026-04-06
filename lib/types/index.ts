export interface Trip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  currency: string
  budget: number
  status: 'planificado' | 'en curso' | 'finalizado'
  color_idx: number
  created_at: string
}

export interface Activity {
  id: string
  trip_id: string
  day: number
  name: string
  time: string
  time_real: string
  type: string
  status: 'pendiente' | 'realizado' | 'cancelado'
  note: string
}

export interface Expense {
  id: string
  trip_id: string
  name: string
  category: string
  estimated: number
  real: number | null
}

export interface Place {
  id: string
  trip_id: string
  name: string
  type: string
  visited: number
  rating: number
  note: string
  lat: number | null
  lng: number | null
}

export interface Document {
  id: string
  trip_id: string
  name: string
  type: string
  url: string
  status: string
  notes: string
}

export interface Proposal {
  id: string
  trip_id: string
  title: string
  description: string
  my_vote: string | null
}

export interface JournalEntry {
  id: string
  trip_id: string
  day: number
  date: string
  title: string
  text: string
  rating: number
}

export interface ChecklistItem {
  id: string
  trip_id: string
  category: string
  name: string
  checked: number
}

export interface TripItems {
  itinerary: Activity[]
  expenses: Expense[]
  places: Place[]
  documents: Document[]
  proposals: Proposal[]
  journal: JournalEntry[]
  checklist: ChecklistItem[]
}