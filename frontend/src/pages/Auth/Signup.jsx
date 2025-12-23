import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import useAuthStore from '../../stores/useAuthStore'

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'manager'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [validations, setValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  })
  const { signup, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await signup(formData)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Signup failed. Please try again.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    setError('')

    // Password validation
    if (name === 'password') {
      setValidations({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value)
      })
    }
  }

  const isPasswordValid = Object.values(validations).every(Boolean)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full mx-4"
      >
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ChurnGuard</h1>
            <p className="text-gray-600">Create your account</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                placeholder="Choose a username"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
                disabled={isLoading}
              >
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="Create a password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    {validations.length ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-gray-300" />
                    )}
                    <span className={validations.length ? 'text-green-600' : 'text-gray-500'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    {validations.uppercase ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-gray-300" />
                    )}
                    <span className={validations.uppercase ? 'text-green-600' : 'text-gray-500'}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    {validations.lowercase ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-gray-300" />
                    )}
                    <span className={validations.lowercase ? 'text-green-600' : 'text-gray-500'}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    {validations.number ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-gray-300" />
                    )}
                    <span className={validations.number ? 'text-green-600' : 'text-gray-500'}>
                      One number
                    </span>
                  </div>
                </div>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              whileHover={{ scale: (isLoading || !isPasswordValid) ? 1 : 1.02 }}
              whileTap={{ scale: (isLoading || !isPasswordValid) ? 1 : 0.98 }}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-secondary font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Signup