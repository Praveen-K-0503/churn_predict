import React, { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  RadialBarChart, RadialBar, Legend, ComposedChart, ReferenceLine, Brush,
  Sankey, Treemap, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { 
  Users, TrendingDown, DollarSign, AlertTriangle, Phone, 
  Wifi, Activity, Zap, Settings, Filter, Download, RefreshCw, BarChart3, PieChart as PieIcon
} from 'lucide-react'

const Dashboard = () => {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [activeChart, setActiveChart] = useState('overview')

  // Basic Chart Data
  const basicChurnData = [
    { name: 'Churned', value: 1869, color: '#ef4444' },
    { name: 'Retained', value: 5174, color: '#10b981' }
  ]

  const contractData = [
    { name: 'Month-to-month', customers: 3875, churnRate: 42.7, revenue: 248750, color: '#ef4444' },
    { name: 'One year', customers: 1473, churnRate: 11.3, revenue: 95345, color: '#f59e0b' },
    { name: 'Two year', customers: 1695, churnRate: 2.8, revenue: 109675, color: '#10b981' }
  ]

  // Advanced Chart Data
  const monthlyTrend = [
    { month: 'Jan', revenue: 455000, churnRate: 24.2, newCustomers: 234, lostCustomers: 312, satisfaction: 78 },
    { month: 'Feb', revenue: 462000, churnRate: 25.1, newCustomers: 198, lostCustomers: 289, satisfaction: 76 },
    { month: 'Mar', revenue: 448000, churnRate: 27.3, newCustomers: 156, lostCustomers: 334, satisfaction: 74 },
    { month: 'Apr', revenue: 441000, churnRate: 26.8, newCustomers: 187, lostCustomers: 298, satisfaction: 75 },
    { month: 'May', revenue: 435000, churnRate: 28.1, newCustomers: 145, lostCustomers: 356, satisfaction: 73 },
    { month: 'Jun', revenue: 428000, churnRate: 26.5, newCustomers: 203, lostCustomers: 287, satisfaction: 77 }
  ]

  const serviceCorrelation = [
    { service: 'Phone Service', adoption: 90.3, churnImpact: -5.2, satisfaction: 85 },
    { service: 'Internet Service', adoption: 78.3, churnImpact: 12.4, satisfaction: 72 },
    { service: 'Online Security', adoption: 28.7, churnImpact: -15.8, satisfaction: 88 },
    { service: 'Online Backup', adoption: 34.5, churnImpact: -12.3, satisfaction: 86 },
    { service: 'Device Protection', adoption: 34.4, churnImpact: -11.7, satisfaction: 84 },
    { service: 'Tech Support', adoption: 29.0, churnImpact: -14.9, satisfaction: 89 }
  ]

  const customerSegments = [
    { segment: 'High Value', customers: 1869, avgCharges: 89.45, churnRate: 31.2, ltv: 4847, satisfaction: 68 },
    { segment: 'Medium Value', customers: 3587, avgCharges: 64.27, churnRate: 24.8, ltv: 2891, satisfaction: 75 },
    { segment: 'Low Value', customers: 1587, avgCharges: 35.12, churnRate: 18.9, ltv: 1456, satisfaction: 82 }
  ]

  const tenureAnalysis = [
    { tenure: '0-12', customers: 2083, churnRate: 47.4, avgCharges: 61.2 },
    { tenure: '13-24', customers: 1236, churnRate: 35.8, avgCharges: 58.9 },
    { tenure: '25-36', customers: 1685, churnRate: 22.1, avgCharges: 65.4 },
    { tenure: '37-48', customers: 987, churnRate: 15.3, avgCharges: 68.7 },
    { tenure: '49-60', customers: 743, churnRate: 12.1, avgCharges: 71.2 },
    { tenure: '60+', customers: 309, churnRate: 8.7, avgCharges: 74.8 }
  ]

  const paymentMethodData = [
    { method: 'Electronic check', customers: 2365, churnRate: 45.3, avgCharges: 65.2 },
    { method: 'Mailed check', customers: 1612, churnRate: 19.1, avgCharges: 59.8 },
    { method: 'Bank transfer', customers: 1544, churnRate: 16.9, avgCharges: 62.4 },
    { method: 'Credit card', customers: 1522, churnRate: 15.2, avgCharges: 67.1 }
  ]

  const radarData = [
    { metric: 'Retention Rate', value: 73.5, fullMark: 100 },
    { metric: 'Customer Satisfaction', value: 76.2, fullMark: 100 },
    { metric: 'Service Quality', value: 84.1, fullMark: 100 },
    { metric: 'Revenue Growth', value: 68.9, fullMark: 100 },
    { metric: 'Market Share', value: 71.3, fullMark: 100 },
    { metric: 'Innovation Index', value: 79.6, fullMark: 100 }
  ]

  const treemapData = [
    { name: 'Fiber Optic', size: 3096, churnRate: 30.2, children: [
      { name: 'High Charges', size: 1548, churnRate: 35.4 },
      { name: 'Medium Charges', size: 1548, churnRate: 25.0 }
    ]},
    { name: 'DSL', size: 2421, churnRate: 18.9, children: [
      { name: 'Long Tenure', size: 1210, churnRate: 12.1 },
      { name: 'Short Tenure', size: 1211, churnRate: 25.7 }
    ]},
    { name: 'No Internet', size: 1526, churnRate: 7.4, children: [
      { name: 'Basic Plan', size: 1526, churnRate: 7.4 }
    ]}
  ]

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  const renderBasicCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* 1. Basic Pie Chart - Churn Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Basic: Churn Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={basicChurnData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            >
              {basicChurnData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value.toLocaleString(), 'Customers']} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Basic Bar Chart - Contract Types */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Basic: Contract Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={contractData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value, name) => [value.toLocaleString(), name === 'customers' ? 'Customers' : 'Churn Rate %']} />
            <Bar dataKey="customers" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const renderIntermediateCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* 3. Line Chart - Monthly Trends */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Intermediate: Monthly Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue ($)" />
            <Line yAxisId="right" type="monotone" dataKey="churnRate" stroke="#ef4444" strokeWidth={2} name="Churn Rate %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Area Chart - Customer Segments */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Intermediate: Customer Segments</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={customerSegments}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="segment" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="customers" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Area type="monotone" dataKey="ltv" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const renderAdvancedCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* 5. Scatter Plot - Service Correlation */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Advanced: Service Impact Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid />
            <XAxis dataKey="adoption" name="Adoption Rate" unit="%" />
            <YAxis dataKey="churnImpact" name="Churn Impact" unit="%" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={serviceCorrelation} fill="#8884d8">
              {serviceCorrelation.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.churnImpact < 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Scatter>
            <ReferenceLine x={50} stroke="#666" strokeDasharray="2 2" />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* 6. Composed Chart - Multi-metric Analysis */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Advanced: Multi-Metric Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={tenureAnalysis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tenure" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="customers" fill="#3b82f6" name="Customers" />
            <Line yAxisId="right" type="monotone" dataKey="churnRate" stroke="#ef4444" strokeWidth={2} name="Churn Rate %" />
            <Line yAxisId="right" type="monotone" dataKey="avgCharges" stroke="#10b981" strokeWidth={2} name="Avg Charges $" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const renderExpertCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* 7. Radar Chart - Performance Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Expert: Performance Radar</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar name="Performance" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 8. Radial Bar Chart - Payment Methods */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Expert: Payment Method Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={paymentMethodData}>
            <RadialBar dataKey="churnRate" cornerRadius={10} fill="#8884d8" />
            <Tooltip />
            <Legend />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const renderInteractiveCharts = () => (
    <div className="grid grid-cols-1 gap-6 mb-6">
      {/* 9. Interactive Chart with Brush */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Interactive: Revenue Trend with Zoom</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
            <Line type="monotone" dataKey="satisfaction" stroke="#3b82f6" strokeWidth={2} name="Satisfaction" />
            <Brush dataKey="month" height={30} stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Advanced Telco Analytics Dashboard</h1>
          <p className="text-gray-600">From Basic Charts to Expert-Level Visualizations</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={activeChart}
            onChange={(e) => setActiveChart(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="overview">All Charts</option>
            <option value="basic">Basic Charts</option>
            <option value="intermediate">Intermediate Charts</option>
            <option value="advanced">Advanced Charts</option>
            <option value="expert">Expert Charts</option>
          </select>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow-md text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Customers</p>
              <p className="text-3xl font-bold">7,043</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg shadow-md text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Churn Rate</p>
              <p className="text-3xl font-bold">26.5%</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow-md text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Monthly Revenue</p>
              <p className="text-3xl font-bold">$456K</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg shadow-md text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">At Risk</p>
              <p className="text-3xl font-bold">1,869</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Chart Type Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center space-x-2">
            <PieIcon className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-700">Basic Charts</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Pie, Bar, Simple visualizations</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-500" />
            <span className="font-medium text-gray-700">Intermediate</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Line, Area, Multi-axis charts</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <span className="font-medium text-gray-700">Advanced</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Scatter, Composed, Reference lines</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-red-500" />
            <span className="font-medium text-gray-700">Expert</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Radar, Radial, Interactive</p>
        </div>
      </div>

      {/* Render Charts Based on Selection */}
      {(activeChart === 'overview' || activeChart === 'basic') && renderBasicCharts()}
      {(activeChart === 'overview' || activeChart === 'intermediate') && renderIntermediateCharts()}
      {(activeChart === 'overview' || activeChart === 'advanced') && renderAdvancedCharts()}
      {(activeChart === 'overview' || activeChart === 'expert') && renderExpertCharts()}
      {(activeChart === 'overview' || activeChart === 'expert') && renderInteractiveCharts()}

      {/* Summary Insights */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Chart Type Summary & Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-blue-700">Basic Charts</h4>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Pie Chart: Overall churn distribution</li>
              <li>• Bar Chart: Contract type comparison</li>
              <li>• Simple, clear data representation</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold text-green-700">Intermediate Charts</h4>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Line Chart: Trend analysis over time</li>
              <li>• Area Chart: Stacked data visualization</li>
              <li>• Multi-axis for different metrics</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold text-purple-700">Advanced Charts</h4>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Scatter Plot: Correlation analysis</li>
              <li>• Composed Chart: Multiple chart types</li>
              <li>• Reference lines for benchmarks</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-semibold text-red-700">Expert Charts</h4>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Radar Chart: Multi-dimensional analysis</li>
              <li>• Radial Bar: Circular data representation</li>
              <li>• Interactive features with zoom/brush</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">📈 Key Business Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
            <div>
              <strong>High-Risk Segments:</strong> Month-to-month customers (42.7% churn) need immediate retention focus
            </div>
            <div>
              <strong>Service Impact:</strong> Security services reduce churn by 15.8%, streaming increases it by 8.2%
            </div>
            <div>
              <strong>Payment Risk:</strong> Electronic check users show 45.3% churn vs 15.2% for credit cards
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard