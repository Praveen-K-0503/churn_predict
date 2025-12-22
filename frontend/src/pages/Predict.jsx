import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const Predict = () => {
  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState('')
  const [customerData, setCustomerData] = useState({
    tenure: '',
    MonthlyCharges: '',
    TotalCharges: '',
    Contract: 'Month-to-month',
    PaymentMethod: 'Electronic check',
    PaperlessBilling: 'Yes',
    gender: 'Male',
    Partner: 'No',
    Dependents: 'No',
    PhoneService: 'Yes',
    InternetService: 'Fiber optic'
  })
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDatasets()
  }, [])

  const fetchDatasets = async () => {
    try {
      const response = await axios.get('/api/ml/datasets/')
      setDatasets(response.data)
      if (response.data.length > 0) {
        setSelectedDataset(response.data[0].id.toString())
      }
    } catch (error) {
      toast.error('Failed to fetch datasets')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCustomerData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePredict = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset')
      return
    }

    // Validate required fields
    if (!customerData.tenure || !customerData.MonthlyCharges) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    setPrediction(null)

    try {
      const response = await axios.post('/api/ml/predict/', {
        customer_data: {
          ...customerData,
          tenure: parseInt(customerData.tenure),
          MonthlyCharges: parseFloat(customerData.MonthlyCharges),
          TotalCharges: customerData.TotalCharges ? parseFloat(customerData.TotalCharges) : customerData.MonthlyCharges * customerData.tenure
        },
        dataset_id: parseInt(selectedDataset)
      })

      setPrediction(response.data)
      toast.success('Prediction completed!')
    } catch (error) {
      const message = error.response?.data?.error || 'Prediction failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return CheckCircle
      case 'medium': return TrendingUp
      case 'high': return AlertTriangle
      default: return Target
    }
  }

  // Prepare SHAP data for chart
  const shapData = prediction?.shap_values ? 
    Object.entries(prediction.shap_values).map(([feature, value]) => ({
      feature: feature.replace(/_/g, ' '),
      impact: parseFloat(value) * 100
    })).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 5) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Customer Churn Prediction</h1>
        <p className="text-gray-600">Predict individual customer churn risk and get actionable insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
          
          {/* Dataset Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dataset
            </label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="input-field"
            >
              <option value="">Select dataset...</option>
              {datasets.map(dataset => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.filename}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tenure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenure (months) *
              </label>
              <input
                type="number"
                name="tenure"
                value={customerData.tenure}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g., 12"
                min="0"
                required
              />
            </div>

            {/* Monthly Charges */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Charges ($) *
              </label>
              <input
                type="number"
                name="MonthlyCharges"
                value={customerData.MonthlyCharges}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g., 79.99"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Total Charges */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Charges ($)
              </label>
              <input
                type="number"
                name="TotalCharges"
                value={customerData.TotalCharges}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Auto-calculated if empty"
                min="0"
                step="0.01"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={customerData.gender}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Contract */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Type
              </label>
              <select
                name="Contract"
                value={customerData.Contract}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="Month-to-month">Month-to-month</option>
                <option value="One year">One year</option>
                <option value="Two year">Two year</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                name="PaymentMethod"
                value={customerData.PaymentMethod}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="Electronic check">Electronic check</option>
                <option value="Mailed check">Mailed check</option>
                <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                <option value="Credit card (automatic)">Credit card (automatic)</option>
              </select>
            </div>

            {/* Internet Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internet Service
              </label>
              <select
                name="InternetService"
                value={customerData.InternetService}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="Fiber optic">Fiber optic</option>
                <option value="DSL">DSL</option>
                <option value="No">No internet service</option>
              </select>
            </div>

            {/* Paperless Billing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paperless Billing
              </label>
              <select
                name="PaperlessBilling"
                value={customerData.PaperlessBilling}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <motion.button
            onClick={handlePredict}
            disabled={loading || !selectedDataset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-6 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Predicting...</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>Predict Churn Risk</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Prediction Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Prediction Results</h3>
          
          {!prediction && !loading && (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Enter customer information and click predict</p>
            </div>
          )}

          {prediction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Risk Score */}
              <div className="text-center">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${getRiskColor(prediction.risk_level)}`}>
                  {React.createElement(getRiskIcon(prediction.risk_level), { className: "w-5 h-5" })}
                  <span className="font-semibold capitalize">{prediction.risk_level} Risk</span>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-gray-800">
                    {(prediction.probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-gray-600">Churn Probability</div>
                </div>
              </div>

              {/* Feature Impact */}
              {shapData.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Key Factors</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={shapData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="feature" type="category" width={80} />
                      <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Impact']} />
                      <Bar 
                        dataKey="impact" 
                        fill={(entry) => entry.impact > 0 ? '#EF4444' : '#10B981'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recommendations */}
              {prediction.insights && prediction.insights.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {prediction.insights.map((insight, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Sample Customers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sample Customer Profiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: "High Risk Profile",
              data: { tenure: 1, MonthlyCharges: 85.0, Contract: "Month-to-month", PaymentMethod: "Electronic check" },
              description: "New customer with high charges and month-to-month contract"
            },
            {
              name: "Medium Risk Profile", 
              data: { tenure: 24, MonthlyCharges: 65.0, Contract: "One year", PaymentMethod: "Mailed check" },
              description: "Established customer with moderate charges"
            },
            {
              name: "Low Risk Profile",
              data: { tenure: 48, MonthlyCharges: 45.0, Contract: "Two year", PaymentMethod: "Bank transfer (automatic)" },
              description: "Long-term customer with automatic payments"
            }
          ].map((profile, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">{profile.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{profile.description}</p>
              <button
                onClick={() => setCustomerData({ ...customerData, ...profile.data })}
                className="text-sm text-primary hover:text-secondary font-medium"
              >
                Load Profile
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Predict