import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import useAuthStore from './stores/useAuthStore'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load pages
const Login = lazy(() => import('./pages/Auth/Login'))
const Signup = lazy(() => import('./pages/Auth/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Upload = lazy(() => import('./pages/Upload'))
const Train = lazy(() => import('./pages/Train'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Predict = lazy(() => import('./pages/Predict'))

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, token } = useAuthStore()
  
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }
  
  return children
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
}

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        <Routes>
          <Route path="/login" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Login />
            </Suspense>
          } />
          <Route path="/signup" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Signup />
            </Suspense>
          } />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-auto p-6">
                    <AnimatePresence mode="wait">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={
                          <motion.div
                            key="dashboard"
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                          >
                            <Suspense fallback={<LoadingSpinner />}>
                              <Dashboard />
                            </Suspense>
                          </motion.div>
                        } />
                        <Route path="/upload" element={
                          <ProtectedRoute requiredRole="admin">
                            <motion.div
                              key="upload"
                              initial="initial"
                              animate="in"
                              exit="out"
                              variants={pageVariants}
                              transition={pageTransition}
                            >
                              <Suspense fallback={<LoadingSpinner />}>
                                <Upload />
                              </Suspense>
                            </motion.div>
                          </ProtectedRoute>
                        } />
                        <Route path="/train" element={
                          <ProtectedRoute requiredRole="admin">
                            <motion.div
                              key="train"
                              initial="initial"
                              animate="in"
                              exit="out"
                              variants={pageVariants}
                              transition={pageTransition}
                            >
                              <Suspense fallback={<LoadingSpinner />}>
                                <Train />
                              </Suspense>
                            </motion.div>
                          </ProtectedRoute>
                        } />
                        <Route path="/analytics/:datasetId" element={
                          <motion.div
                            key="analytics"
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                          >
                            <Suspense fallback={<LoadingSpinner />}>
                              <Analytics />
                            </Suspense>
                          </motion.div>
                        } />
                        <Route path="/predict" element={
                          <motion.div
                            key="predict"
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                          >
                            <Suspense fallback={<LoadingSpinner />}>
                              <Predict />
                            </Suspense>
                          </motion.div>
                        } />
                      </Routes>
                    </AnimatePresence>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App