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
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: getFilter()
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

  const getFilter = () => {
    if (table === 'cleaning_requests') {
      return userType === 'landlord' 
        ? `landlord_id=eq.${userId}`
        : `cleaner_id=eq.${userId},status=eq.pending`
    }
    if (table === 'messages') {
      return `or(sender_id.eq.${userId},recipient_id.eq.${userId})`
    }
    if (table === 'properties') {
      return `landlord_id=eq.${userId}`
    }
    return ''
  }

  const loadData = async () => {
    try {
      setLoading(true)
      let query = supabase.from(table).select('*')

      if (table === 'cleaning_requests') {
        query = query.select(`
          *,
          properties(property_name, address, special_instructions),
          landlord:users!landlord_id(raw_user_meta_data),
          cleaner:users!cleaner_id(raw_user_meta_data)
        `)

        if (userType === 'landlord') {
          query = query.eq('landlord_id', userId)
        } else {
          query = query.or(`cleaner_id.is.null,cleaner_id.eq.${userId}`)
        }
      } else if (table === 'properties') {
        query = query.eq('landlord_id', userId)
      } else if (table === 'messages') {
        query = query
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .select(`
            *,
            sender:users!sender_id(raw_user_meta_data),
            recipient:users!recipient_id(raw_user_meta_data)
          `)
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

    switch (eventType) {
      case 'INSERT':
        setData(prev => [newRecord, ...prev])
        if (table === 'cleaning_requests' && userType === 'cleaner') {
          toast.success('🧹 New cleaning request available!')
        }
        if (table === 'messages' && newRecord.recipient_id === userId) {
          toast.success('💬 New message received!')
        }
        break
      
      case 'UPDATE':
        setData(prev => prev.map(item => 
          item.id === newRecord.id ? newRecord : item
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
