import React from 'react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ChurnGuard</h1>
          <p className="text-sm text-gray-600">AI-Powered Customer Retention Platform</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">Demo Mode</p>
            <p className="text-xs text-gray-500">97% ML Accuracy</p>
          </div>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">CG</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header