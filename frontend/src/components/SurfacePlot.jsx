import React from 'react'
import Plot from 'react-plotly.js'

const SurfacePlot = ({ data, title = "3D Surface Plot" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for surface plot</p>
      </div>
    )
  }

  const numericColumns = Object.keys(data[0]).filter(key => 
    typeof data[0][key] === 'number'
  )

  if (numericColumns.length < 3) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Need at least 3 numeric columns for surface plot</p>
      </div>
    )
  }

  // Create grid data for surface plot
  const [xCol, yCol, zCol] = numericColumns.slice(0, 3)
  
  // Get unique x and y values and sort them
  const xValues = [...new Set(data.map(row => row[xCol]))].sort((a, b) => a - b)
  const yValues = [...new Set(data.map(row => row[yCol]))].sort((a, b) => a - b)
  
  // Create Z matrix
  const zMatrix = []
  
  for (let i = 0; i < yValues.length; i++) {
    const row = []
    for (let j = 0; j < xValues.length; j++) {
      // Find data point or interpolate
      const point = data.find(d => 
        Math.abs(d[xCol] - xValues[j]) < 0.001 && 
        Math.abs(d[yCol] - yValues[i]) < 0.001
      )
      
      if (point) {
        row.push(point[zCol])
      } else {
        // Simple interpolation - use average of nearby points
        const nearbyPoints = data.filter(d => 
          Math.abs(d[xCol] - xValues[j]) < (xValues[1] - xValues[0]) * 2 &&
          Math.abs(d[yCol] - yValues[i]) < (yValues[1] - yValues[0]) * 2
        )
        
        if (nearbyPoints.length > 0) {
          const avg = nearbyPoints.reduce((sum, p) => sum + p[zCol], 0) / nearbyPoints.length
          row.push(avg)
        } else {
          row.push(0)
        }
      }
    }
    zMatrix.push(row)
  }

  const plotData = [{
    z: zMatrix,
    x: xValues,
    y: yValues,
    type: 'surface',
    colorscale: 'Viridis',
    showscale: true,
    colorbar: {
      title: zCol,
      titleside: 'right'
    },
    contours: {
      z: {
        show: true,
        usecolormap: true,
        highlightcolor: "#42f462",
        project: { z: true }
      }
    }
  }]

  const layout = {
    title: {
      text: title,
      font: { size: 16 }
    },
    scene: {
      xaxis: { 
        title: xCol,
        backgroundcolor: "rgb(230, 230,230)",
        gridcolor: "rgb(255, 255, 255)",
        showbackground: true,
        zerolinecolor: "rgb(255, 255, 255)"
      },
      yaxis: { 
        title: yCol,
        backgroundcolor: "rgb(230, 230,230)",
        gridcolor: "rgb(255, 255, 255)",
        showbackground: true,
        zerolinecolor: "rgb(255, 255, 255)"
      },
      zaxis: { 
        title: zCol,
        backgroundcolor: "rgb(230, 230,230)",
        gridcolor: "rgb(255, 255, 255)",
        showbackground: true,
        zerolinecolor: "rgb(255, 255, 255)"
      },
      camera: {
        eye: { x: 1.2, y: 1.2, z: 0.6 }
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

export default SurfacePlot