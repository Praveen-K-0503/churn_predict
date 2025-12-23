import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Lightbulb,
  BarChart3,
  Table,
  TrendingUp,
  Search,
  Sparkles
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, PieChart, Pie, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const NaturalLanguageQuery = () => {
  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState('')
  const [messages, setMessages] = useState([])
  const [inputQuery, setInputQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef(null)

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  const exampleQueries = [
    "Show me high temperature records",
    "What is the average pressure?",
    "Find correlations between flow and pressure",
    "How many equipment types are there?",
    "Show me anomalies in temperature",
    "Compare pressure across equipment types"
  ]

  useEffect(() => {
    fetchDatasets()
    // Add welcome message
    setMessages([{
      id: 1,
      type: 'bot',
      content: "Hi! I'm your AI assistant. Ask me anything about your data in plain English!",
      timestamp: new Date()
    }])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchDatasets = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/ml/datasets/')
      const data = await response.json()
      setDatasets(data.datasets || [])
      if (data.datasets?.length > 0 && !selectedDataset) {
        setSelectedDataset(data.datasets[0].id)
      }
    } catch (error) {
      console.error('Error fetching datasets:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendQuery = async () => {
    if (!inputQuery.trim() || !selectedDataset) {
      toast.error('Please enter a query and select a dataset')
      return
    }

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputQuery,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    setIsProcessing(true)
    const query = inputQuery
    setInputQuery('')

    try {
      const response = await fetch('http://localhost:8000/api/ml/nl-query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          dataset_id: selectedDataset
        })
      })

      const data = await response.json()

      if (data.success) {
        // Add bot response
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.result.answer,
          data: data.result.data,
          visualization: data.result.visualization,
          intent: data.result.intent,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: `Sorry, I couldn't process that query: ${data.error}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, there was an error processing your query. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExampleClick = (example) => {
    setInputQuery(example)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendQuery()
    }
  }

  const renderVisualization = (message) => {
    if (!message.data || !message.visualization) return null

    switch (message.visualization) {
      case 'table':
        return (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full table-auto bg-white rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  {Object.keys(message.data[0] || {}).map(key => (
                    <th key={key} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.data.slice(0, 10).map((row, index) => (
                  <tr key={index} className="border-t">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="px-4 py-2 text-sm text-gray-700">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'bar':
        return (
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={message.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case 'scatter':
        return (
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={message.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis dataKey="value" />
                <Tooltip />
                <Scatter fill="#EF4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )

      case 'number':
        return (
          <div className="mt-3 grid grid-cols-2 gap-4">
            {Object.entries(message.data).map(([key, value]) => (
              <div key={key} className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{value}</p>
                <p className="text-sm text-blue-700">{key.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Chat Assistant</h1>
          <p className="text-gray-600">Ask questions about your data in natural language</p>
        </div>
        
        <div className="w-80">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Dataset
          </label>
          <select
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a dataset...</option>
            {datasets.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name} ({dataset.rows} rows)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Example Queries */}
      {messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-800">Try asking:</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <p className="text-sm text-blue-700">{example}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Intent Badge */}
                      {message.intent && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {message.intent}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Visualization */}
                    {renderVisualization(message)}
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Processing indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex space-x-3 max-w-3xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your data..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing || !selectedDataset}
            />
            <button
              onClick={handleSendQuery}
              disabled={isProcessing || !inputQuery.trim() || !selectedDataset}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NaturalLanguageQuery