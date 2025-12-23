import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Activity, AlertTriangle, CheckCircle, Zap, Users, TrendingUp, TrendingDown, Bell, Wifi, WifiOff } from 'lucide-react'

const RealTimeMonitoring = () => {
  const [isConnected, setIsConnected] = useState(true)
  const [customerMetrics, setCustomerMetrics] = useState({})
  const [churnAlerts, setChurnAlerts] = useState([])
  const [realtimeData, setRealtimeData] = useState([])
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h')

  useEffect(() => {
    // Connect to WebSocket for real-time data
    const ws = new WebSocket('ws://localhost:8000/ws/customer-monitoring/')
    
    ws.onopen = () => {
      setIsConnected(true)
      console.log('Connected to live data stream')
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'customer_data') {
        updateMetricsFromLiveData(data.data)
      }
    }
    
    ws.onclose = () => {
      setIsConnected(false)
      console.log('Disconnected from live stream')
      // Fallback to simulated data
      const interval = setInterval(generateRealtimeData, 3000)
      return () => clearInterval(interval)
    }
    
    ws.onerror = () => {
      setIsConnected(false)
      // Fallback to simulated data
      const interval = setInterval(generateRealtimeData, 3000)
      return () => clearInterval(interval)
    }
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [])

  const updateMetricsFromLiveData = (liveData) => {
    // Update real-time charts with live data
    const newDataPoint = {
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      churnRate: liveData.churn_rate,
      newCustomers: liveData.new_signups,
      activeUsers: liveData.active_customers,
      riskScore: (liveData.high_risk_customers / liveData.active_customers) * 100
    }
    
    setRealtimeData(prev => [...prev.slice(-19), newDataPoint])
    
    // Update customer metrics
    setCustomerMetrics({
      totalCustomers: liveData.active_customers,
      activeCustomers: liveData.active_customers,
      churnRate: liveData.churn_rate.toFixed(1),
      newCustomers: liveData.new_signups,
      riskScore: ((liveData.high_risk_customers / liveData.active_customers) * 100).toFixed(1),
      retentionRate: (100 - liveData.churn_rate).toFixed(1),
      avgRevenue: 64.76,
      highRiskCustomers: liveData.high_risk_customers
    })
    
    // Generate alerts for significant events
    if (liveData.payment_failures > 20) {
      const newAlert = {
        id: Date.now(),
        message: `High payment failure rate detected: ${liveData.payment_failures} failures`,
        severity: 'high',
        timestamp: new Date().toLocaleTimeString(),
        type: 'payment_failure'
      }
      setChurnAlerts(prev => [newAlert, ...prev.slice(0, 9)])
    }
  }

  const generateRealtimeData = () => {
    const now = new Date()
    const timePoints = []
    
    // Generate last 20 data points
    for (let i = 19; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3 * 60 * 1000) // 3-minute intervals
      timePoints.push({
        time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        churnRate: 26.5 + (Math.random() - 0.5) * 4,
        newCustomers: Math.floor(15 + Math.random() * 10),
        activeUsers: Math.floor(6800 + Math.random() * 400),
        riskScore: 45 + (Math.random() - 0.5) * 20
      })
    }
    
    setRealtimeData(timePoints)
    
    // Update customer metrics
    const latest = timePoints[timePoints.length - 1]
    setCustomerMetrics({
      totalCustomers: 7043,
      activeCustomers: latest.activeUsers,
      churnRate: latest.churnRate.toFixed(1),
      newCustomers: latest.newCustomers,
      riskScore: latest.riskScore.toFixed(1),
      retentionRate: (100 - latest.churnRate).toFixed(1),
      avgRevenue: 64.76,
      highRiskCustomers: Math.floor(latest.activeUsers * 0.15)
    })
    
    // Generate alerts
    if (Math.random() > 0.7) {
      const alertTypes = [
        'High churn risk detected for customer segment: Month-to-month Fiber users',
        'Unusual payment failure spike in Electronic check customers',
        'Customer satisfaction scores dropping in Region West',
        'Increased support tickets from senior citizen customers',
        'Contract renewal rate below threshold for Q4'
      ]
      
      const newAlert = {
        id: Date.now(),
        message: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        severity: Math.random() > 0.5 ? 'high' : 'medium',
        timestamp: new Date().toLocaleTimeString(),
        type: 'churn_risk'
      }
      
      setChurnAlerts(prev => [newAlert, ...prev.slice(0, 9)])
    }
  }

  const contractData = [
    { name: 'Month-to-month', value: 3875, churnRate: 42.7, color: '#ef4444' },
    { name: 'One year', value: 1473, churnRate: 11.3, color: '#f59e0b' },
    { name: 'Two year', value: 1695, churnRate: 2.8, color: '#10b981' }
  ]

  const serviceData = [
    { service: 'DSL', customers: 2421, churnRate: 18.9 },
    { service: 'Fiber optic', customers: 3096, churnRate: 41.9 },
    { service: 'No Internet', customers: 1526, churnRate: 7.4 }
  ]

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50 text-red-800'
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800'
      default: return 'border-blue-500 bg-blue-50 text-blue-800'
    }
  }

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default: return <Bell className="w-5 h-5 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Customer Monitoring</h1>
          <p className="text-gray-600">Live customer churn analytics and risk monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
            <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customerMetrics.activeCustomers?.toLocaleString()}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{customerMetrics.newCustomers} new today
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Churn Rate</p>
              <p className="text-2xl font-bold text-red-600">{customerMetrics.churnRate}%</p>
              <p className="text-xs text-red-600 flex items-center mt-1">
                <TrendingDown className="w-3 h-3 mr-1" />
                Industry avg: 31%
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Retention Rate</p>
              <p className="text-2xl font-bold text-green-600">{customerMetrics.retentionRate}%</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Target: 75%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Risk Customers</p>
              <p className="text-2xl font-bold text-orange-600">{customerMetrics.highRiskCustomers}</p>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Needs attention
              </p>
            </div>
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Churn Rate Trend */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="mr-2" size={20} />
            Real-Time Churn Rate
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time"
                label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                domain={[20, 35]}
                label={{ value: 'Churn Rate (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Churn Rate']} />
              <Line type="monotone" dataKey="churnRate" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Active Users */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="mr-2" size={20} />
            Active Customers
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time"
                label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                domain={[6400, 7200]}
                label={{ value: 'Active Customers', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip formatter={(value) => [value.toLocaleString(), 'Active Users']} />
              <Line type="monotone" dataKey="activeUsers" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contract Analysis and Service Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Contract Type Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={contractData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, churnRate }) => `${name}: ${churnRate}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contractData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value.toLocaleString(), 'Customers']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {contractData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.color }}></div>
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">{item.churnRate}% churn</span>
              </div>
            ))}
          </div>
        </div>

        {/* Service Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Internet Service Churn Rates</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="service"
                label={{ value: 'Internet Service Type', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Churn Rate (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip formatter={(value) => [`${value}%`, 'Churn Rate']} />
              <Bar dataKey="churnRate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {serviceData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>{item.service}</span>
                <div className="text-right">
                  <div className="font-medium">{item.customers.toLocaleString()} customers</div>
                  <div className="text-gray-500">{item.churnRate}% churn rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts and Risk Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Bell className="mr-2" size={20} />
            Live Alerts
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {churnAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No alerts at this time</p>
                <p className="text-sm">All systems operating normally</p>
              </div>
            ) : (
              churnAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.severity)}`}>
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm opacity-75 mt-1">{alert.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Risk Score Monitoring */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="mr-2" size={20} />
            Risk Score Trends
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time"
                label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                domain={[0, 100]}
                label={{ value: 'Risk Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip formatter={(value) => [`${value.toFixed(1)}`, 'Risk Score']} />
              <Line type="monotone" dataKey="riskScore" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {realtimeData.length > 0 ? Math.floor(customerMetrics.activeCustomers * 0.6) : 0}
              </div>
              <div className="text-xs text-green-600">Low Risk</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">
                {realtimeData.length > 0 ? Math.floor(customerMetrics.activeCustomers * 0.25) : 0}
              </div>
              <div className="text-xs text-yellow-600">Medium Risk</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">
                {customerMetrics.highRiskCustomers || 0}
              </div>
              <div className="text-xs text-red-600">High Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Data Pipeline: Active</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">ML Models: Running</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Alert System: Active</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Last Update: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTimeMonitoring