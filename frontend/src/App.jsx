import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load components
const Home = lazy(() => import('./pages/Home'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DataCleaningEDA = lazy(() => import('./pages/DataCleaningEDA'))
const Train = lazy(() => import('./pages/Train'))
const Predict = lazy(() => import('./pages/Predict'))
const Reports = lazy(() => import('./pages/Reports'))
const RealTimeMonitoring = lazy(() => import('./pages/RealTimeMonitoring'))

// Layout components
const Sidebar = lazy(() => import('./components/Sidebar'))
const Header = lazy(() => import('./components/Header'))

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          
          <div className="flex h-screen">
            <Suspense fallback={<div className="w-64 bg-white shadow-lg"></div>}>
              <Sidebar />
            </Suspense>
            
            <div className="flex-1 flex flex-col overflow-hidden">
              <Suspense fallback={<div className="h-16 bg-white shadow-sm"></div>}>
                <Header />
              </Suspense>
              
              <main className="flex-1 overflow-auto p-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/data-cleaning" element={<DataCleaningEDA />} />
                    <Route path="/train" element={<Train />} />
                    <Route path="/predict" element={<Predict />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/monitoring" element={<RealTimeMonitoring />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App