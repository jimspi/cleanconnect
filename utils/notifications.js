import toast from 'react-hot-toast'

export const notify = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  loading: (message) => toast.loading(message),
  
  // Specific notification types
  requestCreated: () => toast.success('🧹 Cleaning request sent to cleaners!'),
  requestApproved: () => toast.success('✅ Cleaning request approved!'),
  requestDeclined: () => toast.error('❌ Cleaning request declined'),
  propertyAdded: () => toast.success('🏠 Property added successfully!'),
  messagesSent: () => toast.success('💬 Message sent!'),
  supplyReported: () => toast.success('📦 Supply report submitted!'),
  
  // Promise toast for async operations
  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
    })
  }
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatTime = (time) => {
  if (!time) return 'Flexible'
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export const formatDateTime = (datetime) => {
  return new Date(datetime).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export const getUrgencyColor = (urgency) => {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  }
  return colors[urgency] || 'bg-gray-100 text-gray-800'
}
