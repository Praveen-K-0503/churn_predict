import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cube, Activity, TrendingUp, Grid3x3, Layers } from 'lucide-react'
import Plot3D from '../components/Plot3D'
import CorrelationHeatmap from '../components/CorrelationHeatmap'
import TimeSeriesChart from '../components/TimeSeriesChart'
import SurfacePlot from '../components/SurfacePlot'

const AdvancedVisualizations = () => {
  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState('')
  const [datasetData, setDatasetData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('3d-scatter')

  useEffect(() => {
    fetchDatasets()
  }, [])

  useEffect(() => {
    if (selectedDataset) {
      fetchDatasetData()
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

  const fetchDatasetData = async () => {
    if (!selectedDataset) return
    
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/ml/dataset-data/${selectedDataset}/`)
      const data = await response.json()
      setDatasetData(data.data || [])
    } catch (error) {
      console.error('Error fetching dataset data:', error)
      // Fallback: generate sample data
      generateSampleData()
    } finally {
      setLoading(false)
    }
  }

  const generateSampleData = () => {
    // Generate sample data for visualization
    const sampleData = []
    for (let i = 0; i < 50; i++) {
      sampleData.push({
        Flowrate: 100 + Math.random() * 200,
        Pressure: 20 + Math.random() * 50,
        Temperature: 50 + Math.random() * 70,
        Efficiency: 60 + Math.random() * 40
      })
    }
    setDatasetData(sampleData)
  }

  const tabs = [
    { id: '3d-scatter', name: '3D Scatter', icon: Cube },
    { id: 'heatmap', name: 'Correlation Heatmap', icon: Grid3x3 },
    { id: 'timeseries', name: 'Time Series', icon: TrendingUp },
    { id: 'surface', name: '3D Surface', icon: Layers }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Advanced Visualizations</h1>
          <p className="text-gray-600">Interactive 3D plots, heatmaps, and time series analysis</p>
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
            {datasets.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name} ({dataset.rows} rows)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-2 border-b border-gray-200 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.name}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {activeTab === '3d-scatter' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">3D Scatter Plot</h3>
                    <p className="text-sm text-blue-700">
                      Visualize relationships between three numeric variables in 3D space. 
                      Rotate, zoom, and pan to explore data patterns from different angles.
                    </p>
                  </div>
                  <Plot3D data={datasetData} title="3D Data Exploration" />
                </motion.div>
              )}

              {activeTab === 'heatmap' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Correlation Heatmap</h3>
                    <p className="text-sm text-green-700">
                      Discover correlations between all numeric features. Red indicates negative correlation, 
                      blue indicates positive correlation. Hover over cells for exact values.
                    </p>
                  </div>
                  <CorrelationHeatmap data={datasetData} title="Feature Correlations" />
                </motion.div>
              )}

              {activeTab === 'timeseries' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">Time Series Forecasting</h3>
                    <p className="text-sm text-purple-700">
                      Analyze trends over time and view forecasted values. The dashed line shows 
                      predicted future values with confidence intervals.
                    </p>
                  </div>
                  <TimeSeriesChart data={datasetData} title="Trend Analysis & Forecast" />
                </motion.div>
              )}

              {activeTab === 'surface' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-2">3D Surface Plot</h3>
                    <p className="text-sm text-orange-700">
                      Visualize how a variable changes across two dimensions. The surface height 
                      represents the third variable's value. Contour lines show level curves.
                    </p>
                  </div>
                  <SurfacePlot data={datasetData} title="3D Surface Visualization" />
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-blue-50 to-blue-100"
        >
          <Cube className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">Interactive 3D</h3>
          <p className="text-sm text-gray-600">
            Rotate, zoom, and pan through 3D visualizations with smooth interactions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gradient-to-br from-green-50 to-green-100"
        >
          <Grid3x3 className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">Correlation Analysis</h3>
          <p className="text-sm text-gray-600">
            Identify relationships between features with interactive heatmaps
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card bg-gradient-to-br from-purple-50 to-purple-100"
        >
          <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">Forecasting</h3>
          <p className="text-sm text-gray-600">
            Predict future trends with time series analysis and confidence intervals
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-gradient-to-br from-orange-50 to-orange-100"
        >
          <Layers className="w-8 h-8 text-orange-600 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">Surface Plots</h3>
          <p className="text-sm text-gray-600">
            Visualize complex relationships with 3D surface and contour plots
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default AdvancedVisualizations