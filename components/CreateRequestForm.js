import { useState } from 'react'
import { formatDate } from '../utils/notifications'

export default function CreateRequestForm({ user, properties, selectedProperty, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    property_id: selectedProperty?.id || '',
    checkout_date: '',
    checkout_time: '',
    checkin_date: '',
    special_notes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  // Get tomorrow's date as minimum checkout date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Create Cleaning Request</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property *
              </label>
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.property_name} - {property.address}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Checkout Date *
                </label>
                <input
                  type="date"
                  value={formData.checkout_date}
                  onChange={(e) => setFormData({...formData, checkout_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={minDate}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Checkout Time
                </label>
                <input
                  type="time"
                  value={formData.checkout_time}
                  onChange={(e) => setFormData({...formData, checkout_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Check-in Date (Optional)
              </label>
              <input
                type="date"
                value={formData.checkin_date}
                onChange={(e) => setFormData({...formData, checkin_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={formData.checkout_date || minDate}
              />
              <p className="text-xs text-gray-500 mt-1">When is the next guest checking in?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Notes
              </label>
              <textarea
                value={formData.special_notes}
                onChange={(e) => setFormData({...formData, special_notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Any special instructions for this cleaning (extra attention needed, specific areas, etc.)"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">📋 What happens next?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your request will be sent to available cleaners</li>
                <li>• You'll get notified when a cleaner accepts</li>
                <li>• You can message the assigned cleaner directly</li>
                <li>• Track the cleaning status in real-time</li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Send Request to Cleaners
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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
