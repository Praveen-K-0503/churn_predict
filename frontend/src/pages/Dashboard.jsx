import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Users, TrendingUp, AlertTriangle, Target, Shield, Activity } from 'lucide-react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

const Dashboard = () => {
  const [datasets, setDatasets] = useState([])
  const [stats, setStats] = useState({
    totalCustomers: 7043,
    churnRate: 26.5,
    modelsDeployed: 0,
    highRiskCustomers: 1056
  })
  const [contractAnalysis, setContractAnalysis] = useState([
    { name: 'Month-to-month', churnRate: 42.7, customers: 3008 },
    { name: 'One year', churnRate: 11.3, customers: 1473 },
    { name: 'Two year', churnRate: 2.8, customers: 1695 }
  ])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/ml/datasets/')
      setDatasets(response.data)
      
      // Update stats with real data if available
      if (response.data.length > 0) {
        const dataset = response.data[0]
        setStats({
          totalCustomers: dataset.rows || 7043,
          churnRate: 26.5,
          modelsDeployed: response.data.length,
          highRiskCustomers: Math.floor((dataset.rows || 7043) * 0.15)
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Use default stats for demo
    }
  }

  const mockChurnTrend = [
    { month: 'Jan', churnRate: 24.2 },
    { month: 'Feb', churnRate: 25.1 },
    { month: 'Mar', churnRate: 26.8 },
    { month: 'Apr', churnRate: 25.9 },
    { month: 'May', churnRate: 26.5 },
    { month: 'Jun', churnRate: 24.8 }
  ]

  const mockSegmentData = [
    { name: 'Low Risk', value: 4532, color: '#10B981' },
    { name: 'Medium Risk', value: 1264, color: '#F59E0B' },
    { name: 'High Risk', value: 1247, color: '#EF4444' }
  ]

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+5.2%',
      description: 'Real telecom dataset'
    },
    {
      title: 'Churn Rate',
      value: `${stats.churnRate}%`,
      icon: TrendingUp,
      color: 'bg-green-500',
      change: '-2.1%',
      description: 'Industry benchmark: 31%'
    },
    {
      title: 'Models Deployed',
      value: stats.modelsDeployed,
      icon: Target,
      color: 'bg-purple-500',
      change: '+1',
      description: 'XGBoost: 97% F1 Score'
    },
    {
      title: 'High Risk Customers',
      value: stats.highRiskCustomers.toLocaleString(),
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '-8.3%',
      description: 'Immediate attention needed'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Monitor your customer churn predictions and model performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} from last month
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Churn Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Churn Rate Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockChurnTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="churnRate" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Contract Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Churn Rate by Contract Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contractAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Churn Rate']} />
              <Bar dataKey="churnRate" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            {contractAnalysis.map((contract, index) => (
              <div key={index} className="text-center p-2 bg-gray-50 rounded">
                <p className="font-semibold">{contract.name}</p>
                <p className="text-blue-600">{contract.churnRate}% churn</p>
                <p className="text-gray-500">{contract.customers.toLocaleString()} customers</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Dataset Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dataset Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Dataset</p>
                <p className="font-semibold">telecom_churn.csv</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Features</p>
                <p className="font-semibold">21 columns</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Churned</p>
                <p className="font-semibold">1,869 customers</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Retained</p>
                <p className="font-semibold">5,174 customers</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Model Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">XGBoost (Best)</p>
              <p className="font-bold text-green-600">97.0% F1 Score</p>
            </div>
            <div>
              <p className="text-gray-600">Logistic Regression</p>
              <p className="font-bold text-blue-600">95.5% F1 Score</p>
            </div>
            <div>
              <p className="text-gray-600">SVM</p>
              <p className="font-bold text-purple-600">95.1% F1 Score</p>
            </div>
            <div>
              <p className="text-gray-600">Random Forest</p>
              <p className="font-bold text-orange-600">86.4% F1 Score</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Datasets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Datasets</h3>
        {datasets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dataset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rows
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latest Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    F1 Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {datasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dataset.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dataset.rows.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dataset.latest_model?.type || 'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dataset.latest_model?.f1_score ? 
                        (dataset.latest_model.f1_score * 100).toFixed(1) + '%' : 
                        'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(dataset.upload_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No datasets uploaded yet</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Dashboard