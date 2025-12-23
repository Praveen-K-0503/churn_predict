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

export default Analytics