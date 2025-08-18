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
        // Load cleaning requests with properties data
        if (userType === 'landlord') {
          query = query.eq('landlord_id', userId)
        } else {
          // For cleaners: show pending requests OR requests assigned to them
          query = query.or(`and(status.eq.pending,cleaner_id.is.null),cleaner_id.eq.${userId}`)
        }
        
        const { data: requests, error } = await query.order('created_at', { ascending: false })
        if (error) throw error

        // Fetch property data separately
        if (requests && requests.length > 0) {
          const propertyIds = [...new Set(requests.map(r => r.property_id).filter(Boolean))]
          
          if (propertyIds.length > 0) {
            const { data: properties, error: propError } = await supabase
              .from('properties')
              .select('id, property_name, address, special_instructions')
              .in('id', propertyIds)

            if (propError) throw propError

            // Combine the data
            const enrichedData = requests.map(request => ({
              ...request,
              properties: properties.find(p => p.id === request.property_id) || null
            }))

            setData(enrichedData)
          } else {
            setData(requests)
          }
        } else {
          setData([])
        }
      } else if (table === 'properties') {
        query = query.eq('landlord_id', userId)
        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        setData(data || [])
      } else if (table === 'messages') {
        query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        setData(data || [])
      }

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
      if (table === 'properties') {
        return newRecord?.landlord_id === userId || oldRecord?.landlord_id === userId
      }
      if (table === 'cleaning_requests') {
        return newRecord?.landlord_id === userId || 
               newRecord?.cleaner_id === userId ||
               oldRecord?.landlord_id === userId || 
               oldRecord?.cleaner_id === userId
      }
      if (table === 'messages') {
        return newRecord?.sender_id === userId || 
               newRecord?.recipient_id === userId ||
               oldRecord?.sender_id === userId || 
               oldRecord?.recipient_id === userId
      }
      return true
    }

    if (!isRelevant()) return

    switch (eventType) {
      case 'INSERT':
        if (table === 'cleaning_requests') {
          // For cleaning requests, we need to fetch the property data
          fetchPropertyForRequest(newRecord)
        } else {
          setData(prev => {
            // Check if record already exists to prevent duplicates
            const exists = prev.find(item => item.id === newRecord.id)
            if (exists) return prev
            
            return [newRecord, ...prev]
          })
        }
        
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

  const fetchPropertyForRequest = async (request) => {
    try {
      if (!request.property_id) {
        // If no property_id, just add the request without property data
        setData(prev => {
          const exists = prev.find(item => item.id === request.id)
          if (exists) return prev
          return [{ ...request, properties: null }, ...prev]
        })
        return
      }

      const { data: property, error } = await supabase
        .from('properties')
        .select('id, property_name, address, special_instructions')
        .eq('id', request.property_id)
        .single()

      if (error) {
        console.error('Error fetching property:', error)
        // Add request without property data if fetch fails
        setData(prev => {
          const exists = prev.find(item => item.id === request.id)
          if (exists) return prev
          return [{ ...request, properties: null }, ...prev]
        })
        return
      }

      const enrichedRequest = {
        ...request,
        properties: property
      }

      setData(prev => {
        const exists = prev.find(item => item.id === request.id)
        if (exists) return prev
        return [enrichedRequest, ...prev]
      })
    } catch (error) {
      console.error('Error fetching property for request:', error)
      // Add request without property data on error
      setData(prev => {
        const exists = prev.find(item => item.id === request.id)
        if (exists) return prev
        return [{ ...request, properties: null }, ...prev]
      })
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
      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      // Optimistically update the UI without requiring SELECT permission
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ))
      
      return { success: true }
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
