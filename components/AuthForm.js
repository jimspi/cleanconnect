import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notifications'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [company, setCompany] = useState('')
  const [userType, setUserType] = useState('landlord')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        notify.success('Welcome back!')
      } else {
        // Sign up with user type and additional metadata
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`,
              phone_number: phoneNumber,
              company: company,
              user_type: userType
            }
          }
        })
        if (error) throw error
        notify.success('Check your email for confirmation!')
        setMessage('Please check your email and click the confirmation link to complete your registration.')
      }
    } catch (error) {
      notify.error(error.message)
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const clearForm = () => {
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setPhoneNumber('')
    setCompany('')
    setUserType('landlord')
    setMessage('')
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    clearForm()
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {isLogin ? 'Sign In to CleanConnect' : 'Join CleanConnect'}
      </h2>
      
      <form onSubmit={handleAuth} className="space-y-4">
        {!isLogin && (
          <>
            {/* User Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('landlord')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    userType === 'landlord'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">🏠 Landlord</div>
                  <div className="text-sm text-gray-600 mt-1">
                    I need cleaning services
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setUserType('cleaner')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    userType === 'cleaner'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">🧹 Cleaner</div>
                  <div className="text-sm text-gray-600 mt-1">
                    I provide cleaning services
                  </div>
                </button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Phone Number */}
            <input
              type="tel"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            
            {/* Company Field - Dynamic Label */}
            <input
              type="text"
              placeholder={userType === 'landlord' ? 'Company/Property Management (Optional)' : 'Cleaning Company Name (Optional)'}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </>
        )}
        
        {/* Email and Password */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <input
          type="password"
          placeholder="Password (minimum 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength="6"
        />
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white py-3 px-4 rounded-md transition duration-200 font-medium ${
            userType === 'landlord'
              ? 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
              : 'bg-green-600 hover:bg-green-700 disabled:opacity-50'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            isLogin ? 'Sign In' : `Join as ${userType === 'landlord' ? 'Landlord' : 'Cleaner'}`
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <button
          onClick={switchMode}
          className="text-blue-600 hover:underline font-medium"
        >
          {isLogin ? "Don't have an account? Join CleanConnect" : "Already have an account? Sign in"}
        </button>
      </div>
      
      {message && (
        <div className={`mt-4 p-3 rounded-lg ${
          message.includes('email') || message.includes('successful') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
