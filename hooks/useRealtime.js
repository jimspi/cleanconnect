import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useRealtime(table, userId, userType) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!userId) return

    // Initial data load
    loadData()

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Set up real-time subscription with unique channel name
    const channelName = `${table}_changes_${userId}_${Date.now()}`
    const channel = supabase
      .channel(channelName)
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

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, table, userType])

  const loadData = async () => {
    try {
      setLoading(true)
      let query = supabase.from(table).select('*')

      if (table === 'cleaning_requests') {
        query = query.select(`
          *,
          properties(property_name, address, special_instructions),
          landlord:landlord_id(email, raw_user_meta_data)
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
          .select(`
            *,
            sender:sender_id(email, raw_user_meta_data),
            recipient:recipient_id(email, raw_user_meta_data)
          `)
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      
      // Remove duplicates based on ID
      const uniqueData = data ? data.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      ) : []
      
      setData(uniqueData)
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
      if (table === 'properties') return newRecord?.landlord_id === userId || oldRecord?.landlord_id === userId
      if (table === 'cleaning_requests') {
        return newRecord?.landlord_id === userId || newRecord?.cleaner_id === userId ||
               oldRecord?.landlord_id === userId || oldRecord?.cleaner_id === userId
      }
      if (table === 'messages') {
        return newRecord?.sender_id === userId || newRecord?.recipient_id === userId ||
               oldRecord?.sender_id === userId || oldRecord?.recipient_id === userId
      }
      return true
    }

    if (!isRelevant()) return

    switch (eventType) {
      case 'INSERT':
        setData(prev => {
          // Check if record already exists to prevent duplicates
          const exists = prev.find(item => item.id === newRecord.id)
          if (exists) return prev
          
          return [newRecord, ...prev]
        })
        
        // Show notifications for relevant events
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
        setData(prev => prev.filter(item => item.id !== (oldRecord?.id || newRecord?.id)))
        break
    }
  }

  const deleteItem = async (id) => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Optimistically update the UI
      setData(prev => prev.filter(item => item.id !== id))
      
      return { success: true }
    } catch (error) {
      console.error(`Error deleting ${table} item:`, error)
      return { success: false, error }
    }
  }

  const updateItem = async (id, updates) => {
    try {
      const { data: updatedData, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      
      // Optimistically update the UI
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ))
      
      return { success: true, data: updatedData }
    } catch (error) {
      console.error(`Error updating ${table} item:`, error)
      return { success: false, error }
    }
  }

  return { 
    data, 
    loading, 
    refresh: loadData,
    deleteItem,
    updateItem
  }
}
