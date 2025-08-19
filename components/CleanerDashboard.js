import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import RequestCard from './RequestCard'
import MessageCenter from './MessageCenter'
import Calendar from './Calendar'
import SupplyReportForm from './SupplyReportForm'
import { notify, formatDate, getStatusColor } from '../utils/notifications'

export default function CleanerDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showSupplyReport, setShowSupplyReport] = useState(false)
  const [declinedRequests, setDeclinedRequests] = useState(new Set())

  // Real-time data with improved hooks
  const { data: requests, loading: requestsLoading, refresh: refreshRequests, updateItem: updateRequest } = useRealtime('cleaning_requests', user.id, 'cleaner')
  const { data: messages, loading: messagesLoading } = useRealtime('messages', user.id, 'cleaner')

  // Filter out declined requests from the UI and ensure we only show relevant ones
  const filteredRequests = requests.filter(request => {
    // Don't show declined requests
    if (declinedRequests.has(request.id)) return false
    
    // Show pending requests (available to all cleaners) OR requests assigned to this cleaner
    return (request.status === 'pending' && !request.cleaner_id) || 
           (request.cleaner_id === user.id)
  })

  const handleRequestAction = async (requestId, action, price = null) => {
    try {
      if (action === 'accept') {
        // For accepting, assign cleaner and update status
        const { error } = await supabase
          .from('cleaning_requests')
          .update({ 
            cleaner_id: user.id, 
            status: 'approved', 
            price: price 
          })
          .eq('id', requestId)

        if (error) throw error
        notify.success('Request accepted!')
        refreshRequests()
      } else {
        // For declining, hide it from this cleaner's view
        setDeclinedRequests(prev => new Set([...prev, requestId]))
        notify.success('Request declined - hidden from your view')
      }
    } catch (error) {
      console.error('Error updating request:', error)
      notify.error(action === 'accept' ? 'Failed to accept request' : 'Failed to decline request')
    }
  }

  const handleCompleteJob = async (requestId) => {
    if (!confirm('Mark this cleaning job as completed?')) {
      return
    }

    try {
      const result = await updateRequest(requestId, { status: 'completed' })
      
      if (result.success) {
        notify.success('Job marked as completed!')
      } else {
        throw result.error
      }
    } catch (error) {
      console.error('Error completing job:', error)
      notify.error('Failed to complete job')
    }
  }

  const submitSupplyReport = async (reportData) => {
    try {
      const { data, error } = await supabase
        .from('supply_reports')
        .insert([{
          cleaner_id: user.id,
          ...reportData
        }])
        .select()

      if (error) throw error

      notify.success('Supply report submitted!')
      setShowSupplyReport(false)
    } catch (error) {
      console.error('Error submitting supply report:', error)
      notify.error('Failed to submit report')
    }
  }

  // Stats calculations - use filtered requests
  const pendingRequests = filteredRequests.filter(r => r.status === 'pending').length
  const approvedJobs = filteredRequests.filter(r => r.status === 'approved' && r.cleaner_id === user.id).length
  const completedJobs = filteredRequests.filter(r => r.status === 'completed' && r.cleaner_id === user.id).length
  const totalEarnings = filteredRequests
    .filter(r => r.status === 'completed' && r.cleaner_id === user.id && r.price)
    .reduce((sum, r) => sum + parseFloat(r.price || 0), 0)

  const stats = {
    pendingRequests,
    approvedJobs,
    completedJobs,
    totalEarnings: totalEarnings.toFixed(2)
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'requests', name: 'New Requests', icon: '📋' },
    { id: 'schedule', name: 'My Schedule', icon: '📅' },
    { id: 'messages', name: 'Messages', icon: '💬' },
    { id: 'supplies', name: 'Supply Reports', icon: '📦' }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user.user_metadata?.first_name}! 🧹
        </h1>
        <p className="opacity-90">
          Manage your cleaning requests and coordinate with landlords efficiently.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-sm font-medium text-gray-600">Scheduled Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedJobs}</p>
            </div>
            <div className="text-2xl">📅</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedJobs}</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings}</p>
            </div>
            <div className="text-2xl">💰</div>
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
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
                {tab.id === 'requests' && stats.pendingRequests > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {stats.pendingRequests}
                  </span>
                )}
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
          {activeTab === 'overview' && <CleanerOverviewTab stats={stats} requests={filteredRequests} />}
          {activeTab === 'requests' && (
            <RequestsTab 
              requests={filteredRequests.filter(r => r.status === 'pending')}
              onAction={handleRequestAction}
              loading={requestsLoading}
            />
          )}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">My Schedule</h2>

              {filteredRequests.filter(r => r.status === 'approved' && r.cleaner_id === user.id).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled jobs</h3>
                  <p className="text-gray-600">Accepted jobs will appear in your schedule</p>
                </div>
              ) : (
                <>
                  {/* Calendar View */}
                  <Calendar 
                    events={filteredRequests.filter(r => r.status === 'approved' && r.cleaner_id === user.id)} 
                    userType="cleaner" 
                  />

                  {/* List View */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Upcoming Jobs</h3>
                    <div className="space-y-4">
                      {filteredRequests.filter(r => r.status === 'approved' && r.cleaner_id === user.id).map((request) => (
                        <div key={request.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">{request.properties?.property_name}</h4>
                              <p className="text-gray-600">{request.properties?.address}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatDate(request.checkout_date)}</p>
                              <p className="text-sm text-gray-600">{request.checkout_time || 'Flexible'}</p>
                            </div>
                          </div>
                          {request.price && (
                            <p className="text-sm text-green-600 mt-2">Agreed Price: ${request.price}</p>
                          )}
                          <div className="mt-3 flex space-x-3">
                            <button className="text-blue-600 hover:underline text-sm">View Details</button>
                            <button className="text-green-600 hover:underline text-sm">Message Landlord</button>
                            <button 
                              onClick={() => handleCompleteJob(request.id)}
                              className="text-purple-600 hover:underline text-sm"
                            >
                              Mark Complete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {activeTab === 'messages' && <MessageCenter user={user} messages={messages} />}
          {activeTab === 'supplies' && (
            <SuppliesTab 
              onReportSupplies={() => setShowSupplyReport(true)}
            />
          )}
        </div>
      </div>

      {/* Supply Report Modal */}
      {showSupplyReport && (
        <SupplyReportForm
          user={user}
          onSubmit={submitSupplyReport}
          onClose={() => setShowSupplyReport(false)}
        />
      )}
    </div>
  )
}

// Cleaner Overview Tab
function CleanerOverviewTab({ stats, requests }) {
  const recentActivity = requests.slice(0, 5)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard Overview</h2>
      
      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white border rounded-lg">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentActivity.map((request) => (
                <div key={request.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{request.properties?.property_name || 'Property'}</p>
                    <p className="text-sm text-gray-600">
                      Checkout: {formatDate(request.checkout_date)}
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

// New Requests Tab
function RequestsTab({ requests, onAction, loading }) {
  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">New Cleaning Requests</h2>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No new requests</h3>
          <p className="text-gray-600">New cleaning requests from landlords will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard 
              key={request.id} 
              request={request} 
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Supplies Tab
function SuppliesTab({ onReportSupplies }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Supply Reports</h2>
        <button
          onClick={onReportSupplies}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          + Report Low Supplies
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Supply Management</h3>
        <p className="text-gray-600 mb-4">
          Help landlords stay stocked by reporting when supplies are running low at properties
        </p>
        <button
          onClick={onReportSupplies}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Report Supplies
        </button>
      </div>
    </div>
  )
}
