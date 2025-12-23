import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Zap, 
  Settings, 
  Layers, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Cpu,
  BarChart3,
  Target,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

const AdvancedAutoML = () => {
  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState('')
  const [selectedModels, setSelectedModels] = useState(['random_forest', 'xgboost'])
  const [useHyperopt, setUseHyperopt] = useState(true)
  const [useEnsemble, setUseEnsemble] = useState(true)
  const [useNeuralNetwork, setUseNeuralNetwork] = useState(false)
  const [training, setTraining] = useState(false)
  const [results, setResults] = useState(null)
  const [trainingProgress, setTrainingProgress] = useState([])

  const availableModels = [
    { id: 'random_forest', name: 'Random Forest', icon: '🌳' },
    { id: 'xgboost', name: 'XGBoost', icon: '⚡' },
    { id: 'lightgbm', name: 'LightGBM', icon: '💡' },
    { id: 'catboost', name: 'CatBoost', icon: '🐱' },
    { id: 'logistic', name: 'Logistic Regression', icon: '📈' }
  ]

  useEffect(() => {
    fetchDatasets()
  }, [])

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

  const handleModelToggle = (modelId) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    )
  }

  const startAdvancedTraining = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset')
      return
    }

    if (selectedModels.length === 0) {
      toast.error('Please select at least one model')
      return
    }

    setTraining(true)
    setResults(null)
    setTrainingProgress([])

    try {
      const response = await fetch('http://localhost:8000/api/ml/advanced-train/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset_id: selectedDataset,
          models: selectedModels,
          hyperparameter_optimization: useHyperopt,
          ensemble_methods: useEnsemble,
          neural_network: useNeuralNetwork
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.results)
        setTrainingProgress(data.results.training_steps || [])
        toast.success('Advanced AutoML training completed!')
      } else {
        toast.error(data.error || 'Training failed')
      }
    } catch (error) {
      toast.error('Training failed: ' + error.message)
    } finally {
      setTraining(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Advanced AutoML</h1>
        <p className="text-gray-600">
          Hyperparameter optimization, neural networks, and ensemble methods
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dataset & Model Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-800">Model Configuration</h3>
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

          {/* Model Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Models
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelToggle(model.id)}
                  className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                    selectedModels.includes(model.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{model.icon}</span>
                  <span className="text-sm font-medium">{model.name}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Advanced Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-800">Advanced Options</h3>
          </div>

          <div className="space-y-4">
            {/* Hyperparameter Optimization */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-800">Hyperparameter Optimization</h4>
                  <p className="text-sm text-gray-600">Auto-tune model parameters with Optuna</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useHyperopt}
                  onChange={(e) => setUseHyperopt(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Ensemble Methods */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <Layers className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-800">Ensemble Methods</h4>
                  <p className="text-sm text-gray-600">Combine multiple models for better accuracy</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useEnsemble}
                  onChange={(e) => setUseEnsemble(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Neural Networks */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <Cpu className="w-5 h-5 text-purple-600" />
                <div>
                  <h4 className="font-medium text-gray-800">Neural Networks</h4>
                  <p className="text-sm text-gray-600">Deep learning with TensorFlow/Keras</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useNeuralNetwork}
                  onChange={(e) => setUseNeuralNetwork(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* Start Training Button */}
          <button
            onClick={startAdvancedTraining}
            disabled={training || !selectedDataset || selectedModels.length === 0}
            className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {training ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Training Advanced Models...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Advanced Training</span>
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Training Progress */}
      <AnimatePresence>
        {trainingProgress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-800">Training Progress</h3>
            </div>
            
            <div className="space-y-3">
              {trainingProgress.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <span className="font-medium text-gray-800 capitalize">
                      {step.step.replace('_', ' ')}
                    </span>
                    <p className="text-sm text-gray-600">{step.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Best Model Card */}
            <div className="card bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">Best Model</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {results.models[0]?.name?.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600">Algorithm</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {(results.models[0]?.accuracy * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {(results.models[0]?.f1_score * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">F1 Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {results.models[0]?.training_time?.toFixed(1)}s
                  </p>
                  <p className="text-sm text-gray-600">Training Time</p>
                </div>
              </div>
            </div>

            {/* Model Comparison */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-800">Model Comparison</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Model</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Accuracy</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">F1 Score</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">AUC</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time (s)</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Hyperopt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.models.map((model, index) => (
                      <tr key={index} className={`border-t ${index === 0 ? 'bg-green-50' : ''}`}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {model.name.replace('_', ' ').toUpperCase()}
                          {index === 0 && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">BEST</span>}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{(model.accuracy * 100).toFixed(2)}%</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{(model.f1_score * 100).toFixed(2)}%</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{(model.auc_score * 100).toFixed(2)}%</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{model.training_time.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm">
                          {model.hyperopt_used ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Yes</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Advanced Features Used */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`card ${results.hyperparameter_optimization ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className={`w-5 h-5 ${results.hyperparameter_optimization ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h4 className="font-semibold text-gray-800">Hyperparameter Optimization</h4>
                </div>
                <p className={`text-sm ${results.hyperparameter_optimization ? 'text-blue-700' : 'text-gray-600'}`}>
                  {results.hyperparameter_optimization ? 'Enabled - Parameters auto-tuned' : 'Disabled'}
                </p>
              </div>

              <div className={`card ${results.ensemble_methods ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Layers className={`w-5 h-5 ${results.ensemble_methods ? 'text-green-600' : 'text-gray-400'}`} />
                  <h4 className="font-semibold text-gray-800">Ensemble Methods</h4>
                </div>
                <p className={`text-sm ${results.ensemble_methods ? 'text-green-700' : 'text-gray-600'}`}>
                  {results.ensemble_methods ? 'Enabled - Models combined' : 'Disabled'}
                </p>
              </div>

              <div className={`card ${results.neural_network ? 'bg-purple-50' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Cpu className={`w-5 h-5 ${results.neural_network ? 'text-purple-600' : 'text-gray-400'}`} />
                  <h4 className="font-semibold text-gray-800">Neural Networks</h4>
                </div>
                <p className={`text-sm ${results.neural_network ? 'text-purple-700' : 'text-gray-600'}`}>
                  {results.neural_network ? 'Enabled - Deep learning used' : 'Disabled'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdvancedAutoML