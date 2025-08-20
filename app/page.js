'use client'
import { useAuth } from '../hooks/useAuth'
import AuthForm from '../components/AuthForm'
import LandlordDashboard from '../components/LandlordDashboard'
import CleanerDashboard from '../components/CleanerDashboard'
import { supabase } from '../lib/supabase'

export default function Home() {
  const { user, loading } = useAuth()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-700">Loading CleanConnect...</div>
        </div>
      </div>
    )
  }

  // Show landing page and auth form if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="text-2xl">🧹</div>
                <h1 className="text-2xl font-bold text-gray-800">CleanConnect</h1>
              </div>
              <div className="hidden md:flex space-x-6 text-sm text-gray-600">
                <span>🏠 For Landlords</span>
                <span>🧹 For Cleaners</span>
                <span>📱 Always Connected</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Connect Landlords with Professional Cleaners
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your rental property turnovers. Landlords request cleanings, cleaners manage their schedule, and everyone stays connected in real-time.
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-500 mb-8">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Real-time Updates
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Calendar Integration
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Direct Messaging
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <AuthForm />

          {/* Features Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">How CleanConnect Works</h2>
            <div className="grid md:grid-cols-2 gap-12">
              {/* For Landlords */}
              <div className="bg-blue-50 rounded-lg p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">🏠</span>
                  </div>
                  <h3 className="text-2xl font-bold text-blue-800">For Landlords</h3>
                </div>
                <div className="space-y-4 text-blue-700">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-500 font-bold">1.</span>
                    <span>Add rental properties with supply tracking</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-500 font-bold">2.</span>
                    <span>Submit cleaning requests with checkout dates</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-500 font-bold">3.</span>
                    <span>Get real-time notifications when cleaners respond</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-500 font-bold">4.</span>
                    <span>Track progress and receive supply alerts</span>
                  </div>
                </div>
              </div>

              {/* For Cleaners */}
              <div className="bg-green-50 rounded-lg p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">🧹</span>
                  </div>
                  <h3 className="text-2xl font-bold text-green-800">For Cleaners</h3>
                </div>
                <div className="space-y-4 text-green-700">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 font-bold">1.</span>
                    <span>Receive instant notifications for new requests</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 font-bold">2.</span>
                    <span>Review property details and special instructions</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 font-bold">3.</span>
                    <span>Accept jobs and sync with your calendar</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 font-bold">4.</span>
                    <span>Report supply needs and communicate directly</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started Section */}
          <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-gray-600 mb-6">
                Join CleanConnect today and streamline your property management
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">For Landlords</h4>
                  <p className="text-blue-700 text-sm">
                    Manage properties and coordinate cleaning services efficiently
                  </p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">For Cleaners</h4>
                  <p className="text-green-700 text-sm">
                    Find cleaning jobs and manage your schedule in one place
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Route to appropriate dashboard based on user type
  const userType = user.user_metadata?.user_type || 'landlord'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">🧹</div>
              <h1 className="text-2xl font-bold text-gray-800">CleanConnect</h1>
              <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                userType === 'landlord' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {userType === 'landlord' ? '🏠 Landlord' : '🧹 Cleaner'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 hidden md:inline">
                Welcome, {user.user_metadata?.first_name || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userType === 'landlord' ? (
          <LandlordDashboard user={user} />
        ) : (
          <CleanerDashboard user={user} />
        )}
      </main>
    </div>
  )
}
