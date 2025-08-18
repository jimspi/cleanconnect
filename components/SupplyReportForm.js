import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SupplyReportForm({ user, onSubmit, onClose }) {
  const [properties, setProperties] = useState([])
  const [formData, setFormData] = useState({
    property_id: '',
    landlord_id: '',
    supplies_needed: [],
    urgency: 'medium',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  // Load properties where user has completed cleanings
  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaning_requests')
        .select(`
          property_id,
          landlord_id,
          properties(property_name, address, landlord_id)
        `)
        .eq('cleaner_id', user.id)
        .eq('status', 'approved')

      if (error) throw error

      // Remove duplicates and format
      const uniqueProperties = data.reduce((acc, item) => {
        if (!acc.find(p => p.id === item.property_id)) {
          acc.push({
            id: item.property_id,
            name: item.properties.property_name,
            address: item.properties.address,
            landlord_id: item.properties.landlord_id
          })
        }
        return acc
      }, [])

      setProperties(uniqueProperties)
    } catch (error) {
      console.error('Error loading properties:', error)
    }
  }

  const supplies = [
    'Coffee Pods',
    'Shampoo/Toiletries', 
    'Paper Products',
    'Laundry Detergent',
    'Dishwasher Pods',
    'Cleaning Supplies',
    'Toilet Paper',
    'Paper Towels',
    'Trash Bags',
    'Hand Soap',
    'Air Freshener',
    'Vacuum Bags',
    'Other'
  ]

  const toggleSupply = (supply) => {
    if (formData.supplies_needed.includes(supply)) {
      setFormData({
        ...formData,
        supplies_needed: formData.supplies_needed.filter(s => s !== supply)
      })
    } else {
      setFormData({
        ...formData,
        supplies_needed: [...formData.supplies_needed, supply]
      })
    }
  }

  const handlePropertySelect = (propertyId) => {
    const property = properties.find(p => p.id === propertyId)
    setFormData({
      ...formData,
      property_id: propertyId,
      landlord_id: property?.landlord_id || ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.supplies_needed.length === 0) {
      alert('Please select at least one supply item')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Report Low Supplies</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property *
              </label>
              <select
                value={formData.property_id}
                onChange={(e) => handlePropertySelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">Select a property you've cleaned</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Which supplies are running low? *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {supplies.map((supply) => (
                  <button
                    key={supply}
                    type="button"
                    onClick={() => toggleSupply(supply)}
                    className={`p-3 text-sm rounded-lg border-2 transition-all ${
                      formData.supplies_needed.includes(supply)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {supply}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level *
              </label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="low">🟢 Low - Can wait a week</option>
                <option value="medium">🟡 Medium - Needed within few days</option>
                <option value="high">🔴 High - Urgent, needed ASAP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows="3"
                placeholder="Any additional details about the supply situation..."
              />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-2">📦 Supply Report Process</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• The landlord will be notified immediately</li>
                <li>• They can respond directly or restock the property</li>
                <li>• You'll be updated on the status</li>
                <li>• This helps maintain property standards</li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading || formData.supplies_needed.length === 0}
                className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Supply Report'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
