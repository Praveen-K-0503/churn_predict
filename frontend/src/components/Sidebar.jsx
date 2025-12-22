import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Upload, 
  Brain, 
  BarChart3, 
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import useAuthStore from '../stores/useAuthStore'

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const { user } = useAuthStore()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'manager'] },
    { icon: Upload, label: 'Upload Data', path: '/upload', roles: ['admin'] },
    { icon: Brain, label: 'Train Models', path: '/train', roles: ['admin'] },
    { icon: BarChart3, label: 'Analytics', path: '/analytics/1', roles: ['admin', 'manager'] },
    { icon: Target, label: 'Predict', path: '/predict', roles: ['admin', 'manager'] }
  ]

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  )

  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white shadow-lg border-r border-gray-200 flex flex-col"
    >
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
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
                           (item.path.includes('/analytics') && location.pathname.includes('/analytics'))
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
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
    </motion.div>
  )
}

export default Sidebar