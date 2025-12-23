import React, { useState } from 'react'
import { FileText, Download, Calendar, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

const Reports = () => {
  const [reportType, setReportType] = useState('summary')
  const [dateRange, setDateRange] = useState('last30days')
  const [format, setFormat] = useState('pdf')
  const [generating, setGenerating] = useState(false)

  const generateReport = async () => {
    setGenerating(true)
    toast.loading('Generating report...', { id: 'report-gen' })
    
    // Simulate report generation
    setTimeout(() => {
      setGenerating(false)
      toast.success('Report generated successfully!', { id: 'report-gen' })
      
      // Create and download a sample report
      const reportData = {
        title: 'ChurnGuard Analytics Report',
        type: reportType,
        dateRange: dateRange,
        generatedAt: new Date().toISOString(),
        summary: {
          totalEquipment: 15,
          avgTemperature: 84.6,
          avgPressure: 38.2,
          highRiskEquipment: 2,
          recommendations: [
            'Monitor Heat Exchanger-003 closely',
            'Schedule maintenance for Compressor-004',
            'All other equipment operating normally'
          ]
        },
        data: [
          { equipment: 'Reactor-001', temperature: 85.2, pressure: 25.3, status: 'Normal' },
          { equipment: 'Pump-002', temperature: 65.1, pressure: 45.7, status: 'Normal' },
          { equipment: 'Heat Exchanger-003', temperature: 120.5, pressure: 30.1, status: 'Warning' },
          { equipment: 'Compressor-004', temperature: 95.3, pressure: 60.2, status: 'Warning' },
          { equipment: 'Valve-005', temperature: 55.8, pressure: 20.5, status: 'Normal' }
        ]
      }
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `churnguard-${reportType}-report-${Date.now()}.${format === 'json' ? 'json' : 'txt'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 2000)
  }

  const reportTypes = [
    { value: 'summary', label: 'Summary Report', description: 'High-level overview of equipment performance' },
    { value: 'detailed', label: 'Detailed Analysis', description: 'Comprehensive analysis with charts and insights' },
    { value: 'performance', label: 'Performance Report', description: 'Equipment performance metrics and trends' },
    { value: 'maintenance', label: 'Maintenance Report', description: 'Maintenance recommendations and schedules' }
  ]

  const dateRanges = [
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const formats = [
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'excel', label: 'Excel', icon: BarChart3 },
    { value: 'json', label: 'JSON', icon: FileText }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Generator</h1>
        <p className="text-gray-600">Generate comprehensive analytics and performance reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Report Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <div className="space-y-2">
                  {reportTypes.map((type) => (
                    <label key={type.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="reportType"
                        value={type.value}
                        checked={reportType === type.value}
                        onChange={(e) => setReportType(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {dateRanges.map((range) => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {formats.map((fmt) => (
                    <button
                      key={fmt.value}
                      onClick={() => setFormat(fmt.value)}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        format === fmt.value 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <fmt.icon className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-sm font-medium">{fmt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Report Features</h3>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li>• Equipment performance analytics</li>
              <li>• Risk assessment and predictions</li>
              <li>• Maintenance recommendations</li>
              <li>• Historical trend analysis</li>
              <li>• Executive summary dashboard</li>
              <li>• Exportable charts and graphs</li>
            </ul>
          </div>
        </div>

        {/* Preview & Generation */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Report Preview</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="font-medium text-gray-700 mb-2">
                {reportTypes.find(t => t.value === reportType)?.label}
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                {dateRanges.find(d => d.value === dateRange)?.label} • {format.toUpperCase()} Format
              </p>
              
              <div className="text-left bg-gray-50 p-4 rounded-lg text-sm">
                <div className="font-medium mb-2">Report will include:</div>
                <ul className="space-y-1 text-gray-600">
                  <li>• Equipment status overview</li>
                  <li>• Performance metrics and KPIs</li>
                  <li>• Risk analysis and alerts</li>
                  <li>• Maintenance recommendations</li>
                  <li>• Data visualizations</li>
                </ul>
              </div>
            </div>

            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full mt-6 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Generate & Download Report</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-sm">Summary Report</div>
                    <div className="text-xs text-gray-500">Generated 2 hours ago</div>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm">Download</button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-sm">Performance Report</div>
                    <div className="text-xs text-gray-500">Generated yesterday</div>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm">Download</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports