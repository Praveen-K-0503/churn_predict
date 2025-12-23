import React from 'react'
import Plot from 'react-plotly.js'

const Plot3D = ({ data, title = "3D Scatter Plot" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for 3D visualization</p>
      </div>
    )
  }

  // Extract numeric columns for 3D plotting
  const numericColumns = Object.keys(data[0]).filter(key => 
    typeof data[0][key] === 'number'
  )

  if (numericColumns.length < 3) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Need at least 3 numeric columns for 3D plot</p>
      </div>
    )
  }

  const [xCol, yCol, zCol] = numericColumns.slice(0, 3)

  const plotData = [{
    x: data.map(row => row[xCol]),
    y: data.map(row => row[yCol]),
    z: data.map(row => row[zCol]),
    mode: 'markers',
    type: 'scatter3d',
    marker: {
      size: 5,
      color: data.map(row => row[zCol]),
      colorscale: 'Viridis',
      showscale: true,
      colorbar: {
        title: zCol
      }
    },
    text: data.map((row, i) => `Point ${i + 1}<br>${xCol}: ${row[xCol]}<br>${yCol}: ${row[yCol]}<br>${zCol}: ${row[zCol]}`),
    hovertemplate: '%{text}<extra></extra>'
  }]

  const layout = {
    title: {
      text: title,
      font: { size: 16 }
    },
    scene: {
      xaxis: { title: xCol },
      yaxis: { title: yCol },
      zaxis: { title: zCol },
      camera: {
        eye: { x: 1.5, y: 1.5, z: 1.5 }
      }
    },
    margin: { l: 0, r: 0, b: 0, t: 40 },
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

export default Plot3D