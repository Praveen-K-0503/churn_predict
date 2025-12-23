// Analytics.jsx
import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, Filter, Download } from 'lucide-react'

const Analytics = () => {
  const [selectedDataset, setSelectedDataset] = useState('equipment')
  
  const equipmentData = [
    { name: 'Reactor', count: 3, avgTemp: 89.3, avgPressure: 28.6 },
    { name: 'Pump', count: 2, avgTemp: 67.6, avgPressure: 49.2 },
    { name: 'Heat Exchanger', count: 2, avgTemp: 117.2, avgPressure: 31.0 },
    { name: 'Compressor', count: 2, avgTemp: 91.5, avgPressure: 61.5 },
    { name: 'Valve', count: 2, avgTemp: 57.1, avgPressure: 20.7 }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Interactive data analysis and insights</p>
        </div>
        <div className="flex space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Equipment Analysis</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={equipmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgTemp" fill="#3b82f6" name="Avg Temperature" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Summary Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Equipment</p>
                <p className="text-2xl font-bold text-gray-900">15</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Temperature</p>
                <p className="text-2xl font-bold text-orange-600">84.6°C</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Pressure</p>
                <p className="text-2xl font-bold text-blue-600">38.2 bar</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Insights</h3>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li>• Heat Exchangers operate at highest temperatures</li>
              <li>• Compressors show highest pressure readings</li>
              <li>• All equipment within normal operating ranges</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Predict.jsx
const Predict = () => {
  const [inputData, setInputData] = useState({
    Type: 'Reactor',
    Flowrate: 150,
    Pressure: 25,
    Temperature: 85
  })
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)

  const handlePredict = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ml/predict/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: 'equipment',
          input_data: inputData
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setPrediction(result)
      }
    } catch (error) {
      console.error('Prediction error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment Prediction</h1>
        <p className="text-gray-600">Predict equipment performance and risk levels</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Input Parameters</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Type</label>
              <select
                value={inputData.Type}
                onChange={(e) => setInputData({...inputData, Type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="Reactor">Reactor</option>
                <option value="Pump">Pump</option>
                <option value="Heat Exchanger">Heat Exchanger</option>
                <option value="Compressor">Compressor</option>
                <option value="Valve">Valve</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Flowrate</label>
              <input
                type="number"
                value={inputData.Flowrate}
                onChange={(e) => setInputData({...inputData, Flowrate: parseFloat(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pressure</label>
              <input
                type="number"
                value={inputData.Pressure}
                onChange={(e) => setInputData({...inputData, Pressure: parseFloat(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
              <input
                type="number"
                value={inputData.Temperature}
                onChange={(e) => setInputData({...inputData, Temperature: parseFloat(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            <button
              onClick={handlePredict}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Predicting...' : 'Predict Risk'}
            </button>
          </div>
        </div>

        {prediction && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Prediction Results</h3>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                prediction.risk_level === 'High' ? 'bg-red-50 border border-red-200' :
                prediction.risk_level === 'Medium' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-green-50 border border-green-200'
              }`}>
                <h4 className="font-medium mb-2">Risk Level: {prediction.risk_level}</h4>
                <p className="text-sm">Risk Score: {prediction.risk_score?.toFixed(1)}%</p>
                <p className="text-sm">Confidence: {(prediction.confidence * 100)?.toFixed(1)}%</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {prediction.recommendations?.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Reports.jsx
const Reports = () => {
  const [reportType, setReportType] = useState('summary')
  const [generating, setGenerating] = useState(false)

  const generateReport = async () => {
    setGenerating(true)
    // Simulate report generation
    setTimeout(() => {
      setGenerating(false)
      // Create and download a sample report
      const reportData = {
        title: 'ChurnGuard Analytics Report',
        date: new Date().toLocaleDateString(),
        summary: 'Equipment analysis completed successfully',
        data: { totalEquipment: 15, avgTemperature: 84.6, avgPressure: 38.2 }
      }
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `churnguard-report-${Date.now()}.json`
      a.click()
    }, 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Generator</h1>
        <p className="text-gray-600">Generate comprehensive analytics reports</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Report Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="performance">Performance Report</option>
            </select>
          </div>

          <button
            onClick={generateReport}
            disabled={generating}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {generating ? 'Generating Report...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { Analytics, Predict, Reports }