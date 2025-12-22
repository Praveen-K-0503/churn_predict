import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, AlertTriangle, TrendingUp, Users } from 'lucide-react'
import axios from 'axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, HeatMapGrid
} from 'recharts'
import useWebSocket from '../hooks/useWebSocket'

const Analytics = () => {
  const { datasetId } = useParams()
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [highRiskCustomers, setHighRiskCustomers] = useState([])
  const [expandedCustomer, setExpandedCustomer] = useState(null)

  // WebSocket for real-time updates
  const { lastMessage } = useWebSocket(
    datasetId ? `/ws/analytics/${datasetId}/` : null,
    {
      onMessage: (data) => {
        if (data.type === 'analytics_update') {
          setAnalyticsData(data.data)
        }
      }
    }
  )

  useEffect(() => {
    if (datasetId) {
      fetchAnalytics()
    }
  }, [datasetId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/ml/analytics/${datasetId}/`)
      setAnalyticsData(response.data)
      setHighRiskCustomers(response.data.high_risk_customers || [])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    // PDF export functionality would be implemented here
    console.log('Exporting to PDF...')
  }

  const exportToCSV = () => {
    // CSV export functionality would be implemented here
    console.log('Exporting to CSV...')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#10B981', '#F59E0B', '#EF4444']

  // Prepare chart data
  const cohortData = Object.entries(analyticsData.cohort_analysis?.Churn || {}).map(([bucket, rate]) => ({
    tenure: bucket,
    churnRate: (rate * 100).toFixed(1)
  }))

  const featureImportanceData = Object.entries(analyticsData.feature_importance || {})
    .slice(0, 10)
    .map(([feature, importance]) => ({
      feature: feature.replace(/_/g, ' '),
      importance: (importance * 100).toFixed(1)
    }))

  const riskSegmentData = [
    { name: 'Low Risk', value: Math.floor(analyticsData.total_customers * 0.6), color: COLORS[0] },
    { name: 'Medium Risk', value: Math.floor(analyticsData.total_customers * 0.25), color: COLORS[1] },
    { name: 'High Risk', value: Math.floor(analyticsData.total_customers * 0.15), color: COLORS[2] }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive churn analysis and insights</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={exportToCSV} className="btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button onClick={exportToPDF} className="btn-primary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Customers',
            value: analyticsData.total_customers?.toLocaleString() || '0',
            icon: Users,
            color: 'bg-blue-500'
          },
          {
            title: 'Churn Rate',
            value: `${(analyticsData.churn_rate * 100).toFixed(1)}%`,
            icon: TrendingUp,
            color: 'bg-green-500'
          },
          {
            title: 'Model F1 Score',
            value: `${(analyticsData.model_performance?.f1_score * 100).toFixed(1)}%`,
            icon: BarChart,
            color: 'bg-purple-500'
          },
          {
            title: 'High Risk Customers',
            value: highRiskCustomers.length.toLocaleString(),
            icon: AlertTriangle,
            color: 'bg-red-500'
          }
        ].map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{metric.value}</p>
                </div>
                <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Churn by Tenure */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Churn Rate by Tenure</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cohortData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tenure" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Churn Rate']} />
              <Bar dataKey="churnRate" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Risk Segments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Risk Segments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskSegmentData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {riskSegmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Feature Importance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Features</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureImportanceData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="feature" type="category" width={100} />
              <Tooltip formatter={(value) => [`${value}%`, 'Importance']} />
              <Bar dataKey="importance" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Model Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Model Performance</h3>
          <div className="space-y-4">
            {Object.entries(analyticsData.model_performance || {}).map(([metric, value]) => (
              <div key={metric} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{metric.replace('_', ' ')}</span>
                <span className="font-semibold text-gray-800">
                  {typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* High Risk Customers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">High Risk Customers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Charges
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {highRiskCustomers.slice(0, 10).map((customer) => (
                <tr key={customer.customer_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.customer_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full animate-pulse-slow" 
                          style={{ width: `${customer.risk_score * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">
                        {(customer.risk_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${customer.monthly_charges}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.tenure} months
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary hover:text-secondary">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Insights */}
      {analyticsData.insights && analyticsData.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Insights</h3>
          <div className="prose max-w-none">
            {analyticsData.insights.map((insight, index) => (
              <p key={index} className="text-gray-700 mb-2">
                • {insight}
              </p>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Analytics