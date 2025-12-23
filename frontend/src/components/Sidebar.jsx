import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, LayoutDashboard, Brain, BarChart3, Target,
  FileText, Activity, ChevronLeft, ChevronRight, Database
} from 'lucide-react'

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Database, label: 'Data Cleaning & EDA', path: '/data-cleaning' },
    { icon: Brain, label: 'Train Models', path: '/train' },
    { icon: Activity, label: 'Real-Time Monitoring', path: '/monitoring' },
    { icon: Target, label: 'Predict for Customers', path: '/predict' },
    { icon: FileText, label: 'Report Generator', path: '/reports' }
  ]

  return (
    <div className={`bg-white shadow-lg border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            © 2024 ChurnGuard
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar