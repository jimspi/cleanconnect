import { useState } from 'react'
import { formatDate, formatTime } from '../utils/notifications'

export default function RequestCard({ request, onAction }) {
  const [showDetails, setShowDetails] = useState(false)
  const [showPriceForm, setShowPriceForm] = useState(false)
  const [price, setPrice] = useState('')

  const handleAccept = () => {
    if (showPriceForm && price) {
      onAction(request.id, 'accept', parseFloat(price))
      setShowPriceForm(false)
      setPrice('')
    } else {
      setShowPriceForm(true)
    }
  }

  const handleDecline = () => {
    onAction(request.id, 'decline')
  }

  const landlordName = request.landlord?.raw_user_meta_data?.first_name && request.landlord?.raw_user_meta_data?.last_name
    ? `${request.landlord.raw_user_meta_data.first_name} ${request.landlord.raw_user_meta_data.last_name}`
    : 'Landlord'

  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {request.properties?.property_name || 'Property Cleaning'}
          </h3>
          <p className="text-gray-600">{request.properties?.address}</p>
        </div>
        <div className="text-right ml-4">
          <p className="font-medium text-lg">
            {formatDate(request.checkout_date)}
          </p>
          <p className="text-sm text-gray-600">
            {formatTime(request.checkout_time)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">
            <strong>Landlord:</strong> {landlordName}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Contact:</strong> {request.landlord?.email}
          </p>
        </div>
        <div>
          {request.checkin_date && (
            <p className="text-sm text-gray-600">
              <strong>Next Check-in:</strong> {formatDate(request.checkin_date)}
            </p>
          )}
          <p className="text-sm text-gray-600">
            <strong>Request Created:</strong> {formatDate(request.created_at)}
          </p>
        </div>
      </div>

      {request.properties?.special_instructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm">
            <strong>Property Instructions:</strong> {request.properties.special_instructions}
          </p>
        </div>
      )}

      {request.special_notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm">
            <strong>Special Notes for this cleaning:</strong> {request.special_notes}
          </p>
        </div>
      )}

      {showPriceForm && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <label className="block text-sm font-medium text-green-800 mb-2">
            Set Your Price for This Job
          </label>
          <div className="flex items-center space-x-3">
            <span className="text-green-700">$</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
            />
            <button
              onClick={handleAccept}
              disabled={!price}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Confirm
            </button>
          </div>
          <p className="text-xs text-green-600 mt-1">
            This will be the agreed price for the cleaning service
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:underline text-sm"
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
        <div className="space-x-3">
          <button
            onClick={handleDecline}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            {showPriceForm ? 'Set Price First' : 'Accept Job'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t space-y-2 text-sm text-gray-600">
          <p><strong>Request ID:</strong> {request.id.slice(0, 8)}...</p>
          <p><strong>Created:</strong> {new Date(request.created_at).toLocaleString()}</p>
          {request.properties?.supply_list && Object.values(request.properties.supply_list).some(Boolean) && (
            <div>
              <strong>Supplies to Monitor:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                {Object.entries(request.properties.supply_list)
                  .filter(([key, value]) => value)
                  .map(([key, value]) => (
                    <li key={key}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
