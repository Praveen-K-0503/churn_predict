import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Upload = () => {
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, success, error
  const [uploadResult, setUploadResult] = useState(null)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB')
      return
    }

    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!validTypes.includes(fileExtension)) {
      toast.error('Please upload a CSV or Excel file')
      return
    }

    setUploadStatus('uploading')
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/ml/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setUploadResult(response.data)
      setUploadStatus('success')
      toast.success('File uploaded successfully!')
    } catch (error) {
      setUploadStatus('error')
      const message = error.response?.data?.error || 'Upload failed'
      toast.error(message)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  })

  const resetUpload = () => {
    setUploadStatus('idle')
    setUploadResult(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Upload Dataset</h1>
        <p className="text-gray-600">Upload your customer data to train churn prediction models</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload File</h3>
          
          {uploadStatus === 'idle' && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragActive ? 'Drop the file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-gray-500 mb-4">or click to browse</p>
              <p className="text-sm text-gray-400">
                Supports CSV, Excel files (max 50MB)
              </p>
            </div>
          )}

          {uploadStatus === 'uploading' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">Uploading and processing...</p>
              <p className="text-gray-500">This may take a few minutes</p>
            </div>
          )}

          {uploadStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Upload Successful!</p>
              <p className="text-gray-500 mb-4">Your dataset has been processed</p>
              <button
                onClick={resetUpload}
                className="btn-primary"
              >
                Upload Another File
              </button>
            </motion.div>
          )}

          {uploadStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Upload Failed</p>
              <p className="text-gray-500 mb-4">Please try again</p>
              <button
                onClick={resetUpload}
                className="btn-primary"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Upload Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dataset Information</h3>
          
          {uploadResult ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-gray-800">Dataset ID</p>
                  <p className="text-gray-600">{uploadResult.dataset_id}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Rows</p>
                  <p className="text-gray-600">{uploadResult.rows.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Columns</p>
                  <p className="text-gray-600">{uploadResult.columns?.length || 0}</p>
                </div>
              </div>

              {uploadResult.target_distribution && (
                <div>
                  <p className="font-medium text-gray-800 mb-2">Target Distribution</p>
                  <div className="space-y-2">
                    {Object.entries(uploadResult.target_distribution).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-600">{key}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Job ID: {uploadResult.job_id}
                </p>
                <p className="text-sm text-gray-500">
                  Training pipeline has been automatically started
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Upload a dataset to see information here</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Requirements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dataset Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Required Columns</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• customerID (unique identifier)</li>
              <li>• Churn (target variable: Yes/No)</li>
              <li>• tenure (customer tenure in months)</li>
              <li>• MonthlyCharges (monthly charges)</li>
              <li>• TotalCharges (total charges)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Optional Columns</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• gender, Partner, Dependents</li>
              <li>• PhoneService, InternetService</li>
              <li>• Contract, PaymentMethod</li>
              <li>• PaperlessBilling, OnlineBackup</li>
              <li>• And other telecom features</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Upload