import Papa from 'papaparse'

export const exportToCSV = (data, filename = 'churn_data.csv') => {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const exportToPDF = (elementId, filename = 'churn_report.pdf') => {
  // Simple PDF export using browser print
  const element = document.getElementById(elementId)
  
  if (element) {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }
}

export const exportChartToPDF = (chartData, title, filename = 'chart_report.pdf') => {
  // Simple chart data export
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .data-item { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <h2>Data Summary:</h2>
        ${Object.entries(chartData).map(([key, value]) => 
          `<div class="data-item"><strong>${key}:</strong> ${JSON.stringify(value).substring(0, 100)}</div>`
        ).join('')}
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}