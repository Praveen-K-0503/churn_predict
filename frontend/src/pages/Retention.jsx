import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, TrendingUp, Users, Download } from 'lucide-react'
import axios from 'axios'
import { exportToCSV } from '../utils/exportUtils'

const Retention = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState(new Set())

  useEffect(() => {
    fetchRetentionData()
  }, [])

  const fetchRetentionData = async () => {
    try {
      const response = await axios.get('/api/ml/retention/1/')
      setData(response.data)
    } catch (error) {
      console.error('Error fetching retention data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (customerId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId)
    } else {
      newExpanded.add(customerId)
    }
    setExpandedRows(newExpanded)
  }

  const handleExportCSV = () => {
    if (data?.recommendations) {
      exportToCSV(data.recommendations, 'retention_recommendations.csv')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Retention Recommendations</h1>
          <p className="text-gray-600">AI-powered customer retention strategies</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportCSV}
          className="btn-primary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </motion.button>
      </div>

      {/* A/B Test Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recommendations</p>
              <p className="text-2xl font-bold text-gray-800">{data?.recommendations?.length || 0}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Expected Uplift</p>
              <p className="text-2xl font-bold text-gray-800">{(data?.ab_summary?.avg_uplift * 100).toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">A/B Split</p>
              <p className="text-2xl font-bold text-gray-800">{(data?.ab_summary?.A_rate * 100).toFixed(0)}% / {(data?.ab_summary?.B_rate * 100).toFixed(0)}%</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </motion.div>

      {/* Recommendations Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Recommendations</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">A/B Treatment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Uplift</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.recommendations?.map((rec) => (
                <React.Fragment key={rec.customer_id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rec.customer_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${rec.risk_score * 100}%` }}
                            className="bg-red-500 h-2 rounded-full"
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">
                          {(rec.risk_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rec.ab_treatment.startsWith('A') 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {rec.ab_treatment}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(rec.expected_uplift * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rec.priority === 'High' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {rec.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toggleExpanded(rec.customer_id)}
                        className="text-primary hover:text-secondary"
                      >
                        {expandedRows.has(rec.customer_id) ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedRows.has(rec.customer_id) && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 bg-gray-50">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2"
                        >
                          <p><strong>Segment:</strong> {rec.segment}</p>
                          <p><strong>Monthly Charges:</strong> ${rec.monthly_charges}</p>
                          <p><strong>Tenure:</strong> {rec.tenure} months</p>
                          <p><strong>Rule Recommendation:</strong> {rec.rule_recommendation}</p>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default Retention