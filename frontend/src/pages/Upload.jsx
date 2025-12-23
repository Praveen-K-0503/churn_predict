import React, { useState, useEffect } from 'react'
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const Upload = () => {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/ml/upload/', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setUploadResult(result)
        toast.success('Dataset uploaded successfully!')
      } else {
        toast.error('Upload failed')
      }
    } catch (error) {
      toast.error('Upload error: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Dataset</h1>
        <p className="text-gray-600">Upload your CSV file for AI-powered analysis and model training</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop your CSV file here
            </h3>
            <p className="text-gray-500 mb-4">or click to browse</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
            >
              Choose File
            </label>
          </div>

          {file && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={uploadFile}
                disabled={uploading}
                className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload & Analyze'}
              </button>
            </div>
          )}

          {uploadResult && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800">Upload Successful</h4>
              </div>
              <p className="text-green-700 text-sm">
                Dataset ID: {uploadResult.dataset_id}
              </p>
              <p className="text-green-700 text-sm">
                Rows: {uploadResult.rows} | Columns: {uploadResult.columns?.length}
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Supported Formats</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• CSV files (.csv)</li>
              <li>• Excel files (.xlsx, .xls)</li>
              <li>• Maximum file size: 100MB</li>
              <li>• UTF-8 encoding recommended</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">What happens next?</h3>
            <ol className="space-y-2 text-blue-700">
              <li>1. AI analyzes your data structure</li>
              <li>2. Automatic data cleaning and preprocessing</li>
              <li>3. Feature engineering and target detection</li>
              <li>4. Ready for model training and analytics</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Data Privacy</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  Your data is processed securely and never shared with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upload