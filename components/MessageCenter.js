// Replace the entire MessageCenter component with this fixed version:
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { notify, formatDateTime } from '../utils/notifications'

export default function MessageCenter({ user, messages }) {
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [newRecipientEmail, setNewRecipientEmail] = useState('')
  const messagesEndRef = useRef(null)

  // Group messages by conversation
  const conversations = messages.reduce((acc, message) => {
    const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id
    const otherUser = message.sender_id === user.id ? message.recipient : message.sender
    
    if (!acc[otherUserId]) {
      acc[otherUserId] = {
        user: otherUser,
        messages: [],
        lastMessage: message,
        unreadCount: 0
      }
    }
    
    acc[otherUserId].messages.push(message)
    
    // Update last message if this one is newer
    if (new Date(message.created_at) > new Date(acc[otherUserId].lastMessage.created_at)) {
      acc[otherUserId].lastMessage = message
    }
    
    // Count unread messages
    if (message.recipient_id === user.id && !message.read_at) {
      acc[otherUserId].unreadCount++
    }
    
    return acc
  }, {})

  // Sort conversations by last message time
  const sortedConversations = Object.entries(conversations).sort(
    ([, a], [, b]) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation, conversations])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: selectedConversation,
          message_text: newMessage.trim()
        }])

      if (error) throw error

      setNewMessage('')
      notify.success('Message sent!')
    } catch (error) {
      console.error('Error sending message:', error)
      notify.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const startNewConversation = async (e) => {
    e.preventDefault()
    if (!newRecipientEmail.trim() || sending) return

    setSending(true)
    try {
      // Find user by email
      const { data: users, error: userError } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('email', newRecipientEmail.trim())
        .limit(1)

      if (userError || !users.length) {
        notify.error('User not found with that email')
        setSending(false)
        return
      }

      const recipientId = users[0].id
      setSelectedConversation(recipientId)
      setShowNewConversation(false)
      setNewRecipientEmail('')
    } catch (error) {
      console.error('Error finding user:', error)
      notify.error('Failed to find user')
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (messageId) => {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('recipient_id', user.id)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const selectedMessages = selectedConversation ? conversations[selectedConversation]?.messages || [] : []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Messages</h2>
        <button
          onClick={() => setShowNewConversation(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Message
        </button>
      </div>
      
      {showNewConversation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium mb-3">Start New Conversation</h3>
          <form onSubmit={startNewConversation} className="flex space-x-3">
            <input
              type="email"
              value={newRecipientEmail}
              onChange={(e) => setNewRecipientEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address..."
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Start
            </button>
            <button
              type="button"
              onClick={() => setShowNewConversation(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
      
      <div className="bg-white border rounded-lg overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Conversations</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sortedConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="text-3xl mb-2">💬</div>
                  <p>No conversations yet</p>
                  <p className="text-sm">Start a new conversation above</p>
                </div>
              ) : (
                sortedConversations.map(([userId, conversation]) => {
                  const userName = conversation.user?.raw_user_meta_data?.first_name && conversation.user?.raw_user_meta_data?.last_name
                    ? `${conversation.user.raw_user_meta_data.first_name} ${conversation.user.raw_user_meta_data.last_name}`
                    : conversation.user?.email || 'User'

                  return (
                    <button
                      key={userId}
                      onClick={() => {
                        setSelectedConversation(userId)
                        // Mark messages as read
                        conversation.messages
                          .filter(m => m.recipient_id === user.id && !m.read_at)
                          .forEach(m => markAsRead(m.id))
                      }}
                      className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedConversation === userId ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{userName}</p>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.message_text}
                          </p>
                        </div>
                        <div className="ml-2 flex flex-col items-end">
                          <p className="text-xs text-gray-500">
                            {formatDateTime(conversation.lastMessage.created_at).split(' ')[1]}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 mt-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Messages Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-800">
                    {conversations[selectedConversation]?.user?.raw_user_meta_data?.first_name &&
                     conversations[selectedConversation]?.user?.raw_user_meta_data?.last_name
                      ? `${conversations[selectedConversation].user.raw_user_meta_data.first_name} ${conversations[selectedConversation].user.raw_user_meta_data.last_name}`
                      : conversations[selectedConversation]?.user?.email || 'User'
                    }
                  </h3>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p>{message.message_text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatDateTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Type your message..."
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {sending ? '...' : 'Send'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
