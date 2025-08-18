import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import CreateRequestForm from './CreateRequestForm'
import MessageCenter from './MessageCenter'
import Calendar from './Calendar'
import { notify, formatDate, formatTime, getStatusColor } from '../utils/notifications'

export default function LandlordDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateRequest, setShowCreateRequest] = useState(false)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)

  // Real-time data
  const { data: properties, loading: propertiesLoading, refresh: refreshProperties } = useRealtime('properties', user.id, 'landlord')
  const { data: requests, loading: requestsLoading, refresh: refreshRequests } = useRealtime('cleaning_requests', user.id, 'landlord')
  const { data: messages, loading: messagesLoading } = useRealtime('messages', user.id, 'landlord')

  // Stats calculations
  const stats = {
    totalProperties: properties.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    scheduledCleanings: requests.filter(r => r.status === 'approved').length,
    completedThisMonth: requests.filter(r => {
      if (r.status !== 'completed') return false
      const completedDate = new Date(r.updated_at)
      const now = new Date()
      return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear()
    }).length
  }

  const addProperty = async (propertyData) => {
    try {
      const promise = supabase
        .from('properties')
        .insert([{
          landlord_id: user.id,
          ...propertyData
        }])
        .select()

      await notify.promise(promise, {
        loading: 'Adding property...',
        success: 'Property added successfully!',
        error: 'Failed to add property'
      })

      setShowAddProperty(false)
      refreshProperties()
    } catch (error) {
      console.error('Error adding property:', error)
    }
  }

  const createCleaningRequest = async (requestData) => {
    try {
      const promise = supabase
        .from('cleaning_requests')
        .insert([{
          landlord_id: user.id,
          ...requestData
        }])
        .select()

      await notify.promise(promise, {
        loading: 'Sending cleaning request...',
        success: 'Cleaning request sent to cleaners!',
        error: 'Failed to create request'
      })

      setShowCreateRequest(false)
      refreshRequests()
    } catch (error) {
      console.error('Error creating request:', error)
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'properties', name: 'Properties', icon: '🏠' },
    { id: 'requests', name: 'Cleaning Requests', icon: '🧹' },
    { id: 'calendar', name: 'Calendar', icon: '📅' },
    { id: 'messages', name: 'Messages', icon: '💬' }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user.user_metadata?.first_name}! 🏠
        </h1>
        <p className="opacity-90">
          Manage your rental properties and coordinate cleaning services with ease.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
            <div className="text-2xl">🏠</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
            </div>
            <div className="text-2xl">⏳</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled Cleanings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.scheduledCleanings}</p>
            </div>
            <div className="text-2xl">📅</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedThisMonth}</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
                {tab.id === 'messages' && messages.filter(m => !m.read_at && m.recipient_id === user.id).length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {messages.filter(m => !m.read_at && m.recipient_id === user.id).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab stats={stats} properties={properties} requests={requests} />}
          {activeTab === 'properties' && (
            <PropertiesTab 
              properties={properties} 
              showAddProperty={showAddProperty}
              setShowAddProperty={setShowAddProperty}
              addProperty={addProperty}
              loading={propertiesLoading}
              onRequestCleaning={(property) => {
                setSelectedProperty(property)
                setShowCreateRequest(true)
              }}
            />
          )}
          {activeTab === 'requests' && (
            <RequestsTab 
              requests={requests}
              properties={properties}
              loading={requestsLoading}
              onCreateRequest={() => setShowCreateRequest(true)}
            />
          )}
          {activeTab === 'calendar' && <Calendar events={requests} userType="landlord" />}
          {activeTab === 'messages' && <MessageCenter user={user} messages={messages} />}
        </div>
      </div>

      {/* Modals */}
      {showCreateRequest && (
        <CreateRequestForm
          user={user}
          properties={properties}
          selectedProperty={selectedProperty}
          onSubmit={createCleaningRequest}
          onClose={() => {
            setShowCreateRequest(false)
            setSelectedProperty(null)
          }}
        />
      )}
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ stats, properties, requests }) {
  const recentRequests = requests.slice(0, 5)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard Overview</h2>
      
      {/* Quick Actions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
            🏠 Manage Properties
          </button>
          <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
            🧹 Create Request
          </button>
          <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
            📅 View Calendar
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {recentRequests.length > 0 && (
        <div className="bg-white border rounded-lg">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Recent Cleaning Requests</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{request.properties?.property_name}</p>
                    <p className="text-sm text-gray-600">
                      Checkout: {formatDate(request.checkout_date)} at {formatTime(request.checkout_time)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Properties Tab Component
function PropertiesTab({ properties, showAddProperty, setShowAddProperty, addProperty, loading, onRequestCleaning }) {
  if (loading) {
    return <div className="text-center py-8">Loading properties...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Properties</h2>
        <button
          onClick={() => setShowAddProperty(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Property
        </button>
      </div>

      {showAddProperty && (
        <AddPropertyForm 
          onSubmit={addProperty}
          onCancel={() => setShowAddProperty(false)}
        />
      )}

      {properties.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">🏠</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
          <p className="text-gray-600 mb-4">Add your first rental property to get started with CleanConnect</p>
          <button
            onClick={() => setShowAddProperty(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2">{property.property_name}</h3>
              <p className="text-gray-600 mb-3">{property.address}</p>
              {property.special_instructions && (
                <p className="text-sm text-gray-500 mb-4 italic">"{property.special_instructions}"</p>
              )}
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:underline text-sm">Edit</button>
                <button 
                  onClick={() => onRequestCleaning(property)}
                  className="text-green-600 hover:underline text-sm"
                >
                  Request Cleaning
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Continue with remaining components in next file...
