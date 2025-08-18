import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useRealtime(table, userId, userType) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    // Initial data load
    loadData()

    // Set up real-time subscription
    const channel = supabase
      .channel(`${table}_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, table, userType])

  const loadData = async () => {
    try {
      setLoading(true)
      let query = supabase.from(table).select('*')

      if (table === 'cleaning_requests') {
        query = query.select(`
          *,
          properties(property_name, address, special_instructions)
        `)

        if (userType === 'landlord') {
          query = query.eq('landlord_id', userId)
        } else {
          query = query.or(`cleaner_id.is.null,cleaner_id.eq.${userId}`)
        }
      } else if (table === 'properties') {
        query = query.eq('landlord_id', userId)
      } else if (table === 'messages') {
        query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setData(data || [])
    } catch (error) {
      console.error(`Error loading ${table}:`, error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const handleRealtimeUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Only handle updates relevant to this user
    const isRelevant = () => {
      if (table === 'properties') return newRecord?.landlord_id === userId
      if (table === 'cleaning_requests') {
        return newRecord?.landlord_id === userId || newRecord?.cleaner_id === userId
      }
      if (table === 'messages') {
        return newRecord?.sender_id === userId || newRecord?.recipient_id === userId
      }
      return true
    }

    if (!isRelevant()) return

    switch (eventType) {
      case 'INSERT':
        // Prevent duplicates
        setData(prev => {
          const exists = prev.find(item => item.id === newRecord.id)
          if (exists) return prev
          return [newRecord, ...prev]
        })
        
        if (table === 'cleaning_requests' && userType === 'cleaner' && newRecord.landlord_id !== userId) {
          toast.success('🧹 New cleaning request available!')
        }
        if (table === 'messages' && newRecord.recipient_id === userId) {
          toast.success('💬 New message received!')
        }
        break
      
      case 'UPDATE':
        setData(prev => prev.map(item => 
          item.id === newRecord.id ? { ...item, ...newRecord } : item
        ))
        
        if (table === 'cleaning_requests') {
          if (newRecord.status === 'approved' && userType === 'landlord') {
            toast.success('✅ Cleaning request approved!')
          }
          if (newRecord.status === 'declined' && userType === 'landlord') {
            toast.error('❌ Cleaning request declined')
          }
        }
        break
      
      case 'DELETE':
        setData(prev => prev.filter(item => item.id !== oldRecord.id))
        break
    }
  }

  return { data, loading, refresh: loadData }
}
