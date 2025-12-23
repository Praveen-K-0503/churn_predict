import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Shield, 
  Search, 
  TrendingUp, 
  Eye,
  Settings,
  BarChart3,
  Target,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, PieChart, Pie, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const AnomalyDetection = () => {
  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState('')
  const [algorithm, setAlgorithm] = useState('isolation_forest')
  const [contamination, setContamination] = useState(0.1)
  const [detecting, setDetecting] = useState(false)
  const [results, setResults] = useState(null)
  const [insights, setInsights] = useState(null)

  const algorithms = [
    { id: 'isolation_forest', name: 'Isolation Forest', icon: '🌳', description: 'Tree-based anomaly detection' },
    { id: 'local_outlier_factor', name: 'Local Outlier Factor', icon: '📍', description: 'Density-based detection' },
    { id: 'one_class_svm', name: 'One-Class SVM', icon: '🎯', description: 'Support vector machines' },
    { id: 'elliptic_envelope', name: 'Elliptic Envelope', icon: '⭕', description: 'Gaussian distribution' },
    { id: 'knn', name: 'K-Nearest Neighbors', icon: '🔗', description: 'Distance-based detection' }
  ]

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']

  useEffect(() => {
    fetchDatasets()
  }, [])

  useEffect(() => {
    if (selectedDataset) {
      fetchInsights()
    }
  }, [selectedDataset])

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

  const fetchInsights = async () => {
    if (!selectedDataset) return
    
    try {
      const response = await fetch(`http://localhost:8000/api/ml/anomaly-insights/${selectedDataset}/`)
      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error('Error fetching insights:', error)
    }
  }

  const startAnomalyDetection = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset')
      return
    }

    setDetecting(true)
    setResults(null)

    try {
      const response = await fetch('http://localhost:8000/api/ml/detect-anomalies/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset_id: selectedDataset,
          algorithm: algorithm,
          contamination: contamination
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
        toast.success(`Found ${data.statistics.total_anomalies} anomalies!`)
      } else {
        toast.error(data.error || 'Detection failed')
      }
    } catch (error) {
      toast.error('Detection failed: ' + error.message)
    } finally {
      setDetecting(false)
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'Low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Anomaly Detection</h1>
        <p className="text-gray-600">
          Detect outliers, fraud, equipment failures, and quality issues
        </p>
      </div>

      {/* Quick Insights */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <div className="card bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center space-x-3">
              <Eye className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-800">{insights.anomaly_rate.toFixed(1)}%</p>
                <p className="text-sm text-blue-600">Anomaly Rate</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-purple-50 to-purple-100">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-800">{insights.total_anomalies}</p>
                <p className="text-sm text-purple-600">Total Anomalies</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-gray-600" />
              <div>
                <p className={`text-lg font-bold px-2 py-1 rounded ${getRiskColor(insights.risk_level)}`}>
                  {insights.risk_level}
                </p>
                <p className="text-sm text-gray-600">Risk Level</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-green-50 to-green-100">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-800">
                  {(100 - insights.anomaly_rate).toFixed(1)}%
                </p>
                <p className="text-sm text-green-600">Normal Data</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-800">Detection Settings</h3>
          </div>

          {/* Dataset Selection */}
          <div className="mb-6">
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

          {/* Algorithm Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Detection Algorithm
            </label>
            <div className="grid grid-cols-1 gap-3">
              {algorithms.map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => setAlgorithm(algo.id)}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    algorithm === algo.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{algo.icon}</span>
                  <div className="text-left">
                    <p className="font-medium">{algo.name}</p>
                    <p className="text-xs text-gray-500">{algo.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Contamination Rate */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Contamination Rate: {(contamination * 100).toFixed(1)}%
            </label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Start Detection Button */}
          <button
            onClick={startAnomalyDetection}
            disabled={detecting || !selectedDataset}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {detecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Detecting Anomalies...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Start Detection</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Recommendations */}
        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-800">Recommendations</h3>
            </div>

            <div className="space-y-3">
              {insights.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Statistics */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-800">Detection Results</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{results.statistics.total_anomalies}</p>
                  <p className="text-sm text-red-700">Anomalies Found</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{results.statistics.normal_records}</p>
                  <p className="text-sm text-green-700">Normal Records</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{results.statistics.anomaly_percentage.toFixed(2)}%</p>
                  <p className="text-sm text-blue-700">Anomaly Rate</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{results.statistics.algorithm_used.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-sm text-purple-700">Algorithm Used</p>
                </div>
              </div>
            </div>

            {/* Feature Analysis Chart */}
            {results.anomaly_distribution && (
              <div className="card">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-800">Feature Impact Analysis</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={results.anomaly_distribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="difference" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Anomaly Details */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-800">Top Anomalies</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Index</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Anomaly Score</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Key Features</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.anomalies.slice(0, 10).map((anomaly, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">#{anomaly.index}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{anomaly.score.toFixed(4)}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            <XCircle className="w-3 h-3 inline mr-1" />
                            Anomaly
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {Object.entries(anomaly.data)
                            .filter(([key, value]) => typeof value === 'number')
                            .slice(0, 3)
                            .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`)
                            .join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AnomalyDetection