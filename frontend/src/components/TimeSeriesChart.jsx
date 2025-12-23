import React, { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'

const TimeSeriesChart = ({ data, title = "Time Series Analysis" }) => {
  const [selectedColumn, setSelectedColumn] = useState('')
  const [forecastData, setForecastData] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for time series analysis</p>
      </div>
    )
  }

  const numericColumns = Object.keys(data[0]).filter(key => 
    typeof data[0][key] === 'number'
  )

  useEffect(() => {
    if (numericColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(numericColumns[0])
    }
  }, [numericColumns, selectedColumn])

  useEffect(() => {
    if (selectedColumn && data.length > 0) {
      generateForecast()
    }
  }, [selectedColumn, data])

  const generateForecast = () => {
    const values = data.map(row => row[selectedColumn]).filter(v => v !== null && v !== undefined)
    
    if (values.length < 3) return

    // Simple moving average forecast
    const windowSize = Math.min(3, Math.floor(values.length / 3))
    const forecast = []
    const forecastPeriods = Math.min(10, Math.floor(values.length / 2))

    // Calculate trend
    let trend = 0
    if (values.length > 1) {
      trend = (values[values.length - 1] - values[0]) / (values.length - 1)
    }

    // Generate forecast points
    for (let i = 0; i < forecastPeriods; i++) {
      const recentValues = values.slice(-windowSize)
      const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length
      const forecastValue = avg + (trend * (i + 1))
      forecast.push(forecastValue)
    }

    setForecastData(forecast)
  }

  if (numericColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No numeric columns available for time series</p>
      </div>
    )
  }

  const xValues = data.map((_, index) => index + 1)
  const yValues = data.map(row => row[selectedColumn])

  const plotData = [
    {
      x: xValues,
      y: yValues,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Actual',
      line: { color: '#3B82F6', width: 2 },
      marker: { size: 4 }
    }
  ]

  // Add forecast if available
  if (forecastData && forecastData.length > 0) {
    const forecastX = Array.from({ length: forecastData.length }, (_, i) => 
      xValues.length + i + 1
    )
    
    plotData.push({
      x: forecastX,
      y: forecastData,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Forecast',
      line: { color: '#EF4444', width: 2, dash: 'dash' },
      marker: { size: 4 }
    })

    // Add confidence interval
    const confidence = forecastData.map(val => val * 0.1) // 10% confidence interval
    plotData.push({
      x: [...forecastX, ...forecastX.reverse()],
      y: [...forecastData.map((val, i) => val + confidence[i]), 
          ...forecastData.map((val, i) => val - confidence[i]).reverse()],
      fill: 'toself',
      fillcolor: 'rgba(239, 68, 68, 0.2)',
      line: { color: 'transparent' },
      name: 'Confidence Interval',
      showlegend: false,
      hoverinfo: 'skip'
    })
  }

  const layout = {
    title: {
      text: `${title} - ${selectedColumn}`,
      font: { size: 16 }
    },
    xaxis: {
      title: 'Time Period',
      showgrid: true,
      gridcolor: '#E5E7EB'
    },
    yaxis: {
      title: selectedColumn,
      showgrid: true,
      gridcolor: '#E5E7EB'
    },
    legend: {
      x: 0,
      y: 1,
      bgcolor: 'rgba(255,255,255,0.8)'
    },
    margin: { l: 60, r: 40, b: 60, t: 60 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    hovermode: 'x unified'
  }

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d']
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">
          Select Column:
        </label>
        <select
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {numericColumns.map(col => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>
      
      <div className="w-full h-96">
        <Plot
          data={plotData}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>
    </div>
  )
}

export default TimeSeriesChart