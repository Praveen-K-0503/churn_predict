import React from 'react'
import Plot from 'react-plotly.js'

const CorrelationHeatmap = ({ data, title = "Correlation Heatmap" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for correlation analysis</p>
      </div>
    )
  }

  // Calculate correlation matrix
  const numericColumns = Object.keys(data[0]).filter(key => 
    typeof data[0][key] === 'number'
  )

  if (numericColumns.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Need at least 2 numeric columns for correlation</p>
      </div>
    )
  }

  // Calculate correlation matrix
  const correlationMatrix = []
  const correlationValues = []

  for (let i = 0; i < numericColumns.length; i++) {
    const row = []
    for (let j = 0; j < numericColumns.length; j++) {
      const col1 = numericColumns[i]
      const col2 = numericColumns[j]
      
      if (i === j) {
        row.push(1)
      } else {
        // Simple correlation calculation
        const values1 = data.map(row => row[col1]).filter(v => v !== null && v !== undefined)
        const values2 = data.map(row => row[col2]).filter(v => v !== null && v !== undefined)
        
        if (values1.length === 0 || values2.length === 0) {
          row.push(0)
        } else {
          const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length
          const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length
          
          let numerator = 0
          let sum1 = 0
          let sum2 = 0
          
          for (let k = 0; k < Math.min(values1.length, values2.length); k++) {
            const diff1 = values1[k] - mean1
            const diff2 = values2[k] - mean2
            numerator += diff1 * diff2
            sum1 += diff1 * diff1
            sum2 += diff2 * diff2
          }
          
          const denominator = Math.sqrt(sum1 * sum2)
          const correlation = denominator === 0 ? 0 : numerator / denominator
          row.push(isNaN(correlation) ? 0 : correlation)
        }
      }
    }
    correlationMatrix.push(row)
  }

  // Flatten for heatmap
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = 0; j < numericColumns.length; j++) {
      correlationValues.push(correlationMatrix[i][j])
    }
  }

  const plotData = [{
    z: correlationMatrix,
    x: numericColumns,
    y: numericColumns,
    type: 'heatmap',
    colorscale: [
      [0, '#d73027'],
      [0.25, '#f46d43'],
      [0.5, '#ffffff'],
      [0.75, '#74add1'],
      [1, '#313695']
    ],
    zmid: 0,
    zmin: -1,
    zmax: 1,
    showscale: true,
    colorbar: {
      title: 'Correlation',
      titleside: 'right'
    },
    hoverongaps: false,
    hovertemplate: '%{y} vs %{x}<br>Correlation: %{z:.3f}<extra></extra>'
  }]

  // Add text annotations
  const annotations = []
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = 0; j < numericColumns.length; j++) {
      annotations.push({
        x: numericColumns[j],
        y: numericColumns[i],
        text: correlationMatrix[i][j].toFixed(2),
        showarrow: false,
        font: {
          color: Math.abs(correlationMatrix[i][j]) > 0.5 ? 'white' : 'black',
          size: 12
        }
      })
    }
  }

  const layout = {
    title: {
      text: title,
      font: { size: 16 }
    },
    xaxis: {
      title: 'Features',
      side: 'bottom'
    },
    yaxis: {
      title: 'Features'
    },
    annotations: annotations,
    margin: { l: 80, r: 80, b: 80, t: 60 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)'
  }

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d']
  }

  return (
    <div className="w-full h-96">
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  )
}

export default CorrelationHeatmap