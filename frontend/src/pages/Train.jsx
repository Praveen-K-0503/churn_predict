import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import useWebSocket from '../hooks/useWebSocket'

const Train = () => {
  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState('')
  const [selectedModels, setSelectedModels] = useState(['RandomForest'])
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(null)
  const [jobId, setJobId] = useState(null)

  const availableModels = [
    { id: 'LogisticRegression', name: 'Logistic Regression', description: 'Fast linear model' },
    { id: 'RandomForest', name: 'Random Forest', description: 'Ensemble tree model' },
    { id: 'XGBoost', name: 'XGBoost', description: 'Gradient boosting' },
    { id: 'SVM', name: 'Support Vector Machine', description: 'Kernel-based model' }
  ]

  // WebSocket for training progress
  const { lastMessage } = useWebSocket(
    jobId ? `/ws/training/${jobId}/` : null,
    {
      onMessage: (data) => {
        if (data.type === 'training_update') {
          setTrainingProgress(data)
          if (data.status === 'success') {
            setIsTraining(false)
            toast.success('Training completed successfully!')
          } else if (data.status === 'error') {
            setIsTraining(false)
            toast.error('Training failed')
          }
        }
      }
    }
  )

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

  const handleModelToggle = (modelId) => {
    setSelectedModels(prev => 
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    )
  }

  const startTraining = async () => {
    if (!selectedDataset || selectedModels.length === 0) {
      toast.error('Please select a dataset and at least one model')
      return
    }

    setIsTraining(true)
    setTrainingProgress(null)

    try {
      const response = await axios.post('/api/ml/train/', {
        dataset_id: parseInt(selectedDataset),
        models: selectedModels
      })

      setJobId(response.data.job_id)
      toast.success('Training started!')
    } catch (error) {
      setIsTraining(false)
      const message = error.response?.data?.error || 'Failed to start training'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Train Models</h1>
        <p className="text-gray-600">Train machine learning models on your datasets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Training Configuration</h3>
          
          {/* Dataset Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Dataset
            </label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="input-field"
              disabled={isTraining}
            >
              <option value="">Choose a dataset...</option>
              {datasets.map(dataset => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.filename} ({dataset.rows.toLocaleString()} rows)
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Models to Train
            </label>
            <div className="space-y-3">
              {availableModels.map(model => (
                <div key={model.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={model.id}
                    checked={selectedModels.includes(model.id)}
                    onChange={() => handleModelToggle(model.id)}
                    disabled={isTraining}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor={model.id} className="flex-1">
                    <div className="font-medium text-gray-800">{model.name}</div>
                    <div className="text-sm text-gray-500">{model.description}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Start Training Button */}
          <motion.button
            onClick={startTraining}
            disabled={isTraining || !selectedDataset || selectedModels.length === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isTraining ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Training in Progress...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Training</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Training Progress */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Training Progress</h3>
          
          {!isTraining && !trainingProgress && (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Start training to see progress here</p>
            </div>
          )}

          <AnimatePresence>
            {trainingProgress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3">
                  {trainingProgress.status === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : trainingProgress.status === 'error' ? (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {trainingProgress.step || 'Processing...'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: {trainingProgress.status}
                    </p>
                  </div>
                </div>

                {trainingProgress.progress && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{trainingProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${trainingProgress.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Training Steps Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Training Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: 'Data Loading', desc: 'Load dataset from S3' },
            { step: 'Data Cleaning', desc: 'Remove duplicates, handle missing values' },
            { step: 'Feature Engineering', desc: 'Create new features, encode categories' },
            { step: 'Model Training', desc: 'Train selected algorithms, compare performance' }
          ].map((item, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                {index + 1}
              </div>
              <h4 className="font-medium text-gray-800 mb-1">{item.step}</h4>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Train