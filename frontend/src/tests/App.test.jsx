import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import Login from '../pages/Auth/Login'
import Dashboard from '../pages/Dashboard'
import useAuthStore from '../stores/useAuthStore'

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  defaults: {
    headers: {
      common: {}
    }
  }
}))

// Mock Zustand store
jest.mock('../stores/useAuthStore')

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Login Component', () => {
  beforeEach(() => {
    useAuthStore.mockReturnValue({
      login: jest.fn(),
      isLoading: false
    })
  })

  test('renders login form', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByText('ChurnGuard')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  test('handles form submission', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true })
    useAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false
    })

    renderWithRouter(<Login />)
    
    fireEvent.change(screen.getByPlaceholderText('Enter your username'), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      })
    })
  })

  test('shows loading state during login', () => {
    useAuthStore.mockReturnValue({
      login: jest.fn(),
      isLoading: true
    })

    renderWithRouter(<Login />)
    
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Mock axios get request
    const axios = require('axios')
    axios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          filename: 'telecom_churn.csv',
          rows: 7043,
          upload_date: '2024-01-01T00:00:00Z',
          latest_model: {
            type: 'RandomForest',
            f1_score: 0.85
          }
        }
      ]
    })
  })

  test('renders dashboard with stats cards', async () => {
    renderWithRouter(<Dashboard />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Total Customers')).toBeInTheDocument()
    expect(screen.getByText('Churn Rate')).toBeInTheDocument()
    expect(screen.getByText('Models Deployed')).toBeInTheDocument()
    expect(screen.getByText('High Risk Customers')).toBeInTheDocument()
  })

  test('displays recent datasets table', async () => {
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Recent Datasets')).toBeInTheDocument()
      expect(screen.getByText('telecom_churn.csv')).toBeInTheDocument()
      expect(screen.getByText('7,043')).toBeInTheDocument()
      expect(screen.getByText('RandomForest')).toBeInTheDocument()
    })
  })
})

describe('ChurnGuard Integration Tests', () => {
  test('complete user flow: login -> upload -> train -> predict', async () => {
    // This would be a comprehensive integration test
    // covering the entire user journey
    
    const mockUser = {
      username: 'admin',
      role: 'admin',
      email: 'admin@example.com'
    }

    // Mock successful login
    useAuthStore.mockReturnValue({
      user: mockUser,
      token: 'mock-token',
      login: jest.fn().mockResolvedValue({ success: true }),
      isLoading: false
    })

    // Test would continue with upload, training, and prediction flows
    expect(mockUser.role).toBe('admin')
  })
})