from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import pandas as pd
import io
from datetime import datetime
from django.conf import settings
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

@csrf_exempt
def generate_report(request):
    """Generate reports in different formats"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            report_type = data.get('report_type', 'dataset_summary')
            format_type = data.get('format', 'pdf')  # pdf, csv, excel
            dataset_id = data.get('dataset_id')
            
            # Load dataset and metadata
            metadata_dir = os.path.join(settings.BASE_DIR, 'dataset_metadata')
            
            if dataset_id:
                metadata_path = os.path.join(metadata_dir, f'{dataset_id}.json')
                if os.path.exists(metadata_path):
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                    
                    # Load dataset
                    file_path = metadata['file_path']
                    if file_path.endswith('.csv'):
                        df = pd.read_csv(file_path)
                    else:
                        df = pd.read_excel(file_path)
                else:
                    return JsonResponse({'error': 'Dataset not found'}, status=404)
            else:
                # Generate platform summary report
                df = None
                metadata = None
            
            # Generate report based on type and format
            if format_type == 'pdf':
                return generate_pdf_report(report_type, df, metadata)
            elif format_type == 'csv':
                return generate_csv_report(report_type, df, metadata)
            elif format_type == 'excel':
                return generate_excel_report(report_type, df, metadata)
            else:
                return JsonResponse({'error': 'Unsupported format'}, status=400)
                
        except Exception as e:
            return JsonResponse({'error': f'Report generation failed: {str(e)}'}, status=500)
    
    return JsonResponse({'message': 'Report generation endpoint'})

def generate_pdf_report(report_type, df, metadata):
    """Generate PDF report"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        textColor=colors.HexColor('#2563eb')
    )
    
    if report_type == 'dataset_summary':
        story.append(Paragraph("Dataset Analysis Report", title_style))
        story.append(Spacer(1, 12))
        
        if metadata and df is not None:
            # Dataset info
            dataset_info = [
                ['Dataset Name', metadata.get('filename', 'Unknown')],
                ['Upload Date', metadata.get('upload_time', 'Unknown')[:10]],
                ['Total Rows', f"{len(df):,}"],
                ['Total Columns', str(len(df.columns))],
                ['File Size', f"{os.path.getsize(metadata['file_path']) / 1024:.1f} KB"]
            ]
            
            info_table = Table(dataset_info, colWidths=[2*inch, 3*inch])
            info_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(info_table)
            story.append(Spacer(1, 20))
            
            # Data summary
            story.append(Paragraph("Data Summary", styles['Heading2']))
            story.append(Spacer(1, 12))
            
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                summary_data = [['Column', 'Mean', 'Min', 'Max', 'Std Dev']]
                for col in numeric_cols[:5]:  # Top 5 numeric columns
                    summary_data.append([
                        col,
                        f"{df[col].mean():.2f}",
                        f"{df[col].min():.2f}",
                        f"{df[col].max():.2f}",
                        f"{df[col].std():.2f}"
                    ])
                
                summary_table = Table(summary_data, colWidths=[1.5*inch, 1*inch, 1*inch, 1*inch, 1*inch])
                summary_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                story.append(summary_table)
    
    elif report_type == 'model_performance':
        story.append(Paragraph("Model Performance Report", title_style))
        story.append(Spacer(1, 12))
        
        if metadata and 'training_results' in metadata:
            results = metadata['training_results']
            models = results.get('models', [])
            
            if models:
                model_data = [['Model', 'Accuracy', 'F1 Score', 'AUC Score', 'Training Time']]
                for model in models:
                    model_data.append([
                        model['name'].title(),
                        f"{model['accuracy']*100:.1f}%",
                        f"{model['f1_score']*100:.1f}%",
                        f"{model['auc_score']*100:.1f}%",
                        f"{model['training_time']:.2f}s"
                    ])
                
                model_table = Table(model_data, colWidths=[1.5*inch, 1*inch, 1*inch, 1*inch, 1.2*inch])
                model_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                story.append(model_table)
    
    # Footer
    story.append(Spacer(1, 30))
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Paragraph("ChurnGuard AI Platform", styles['Normal']))
    
    doc.build(story)
    buffer.seek(0)
    
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{report_type}_report.pdf"'
    return response

def generate_csv_report(report_type, df, metadata):
    """Generate CSV report"""
    if df is not None:
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
        
        if report_type == 'dataset_summary':
            # Export dataset summary
            summary_df = df.describe()
            summary_df.to_csv(response)
        else:
            # Export full dataset
            df.to_csv(response, index=False)
        
        return response
    else:
        # Generate platform summary CSV
        data = {
            'Report Type': [report_type],
            'Generated On': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
            'Platform': ['ChurnGuard AI']
        }
        summary_df = pd.DataFrame(data)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
        summary_df.to_csv(response, index=False)
        return response

def generate_excel_report(report_type, df, metadata):
    """Generate Excel report"""
    buffer = io.BytesIO()
    
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        if df is not None:
            if report_type == 'dataset_summary':
                # Summary sheet
                summary_df = df.describe()
                summary_df.to_excel(writer, sheet_name='Summary')
                
                # Data types sheet
                dtypes_df = pd.DataFrame({
                    'Column': df.columns,
                    'Data Type': df.dtypes.astype(str),
                    'Non-Null Count': df.count(),
                    'Null Count': df.isnull().sum()
                })
                dtypes_df.to_excel(writer, sheet_name='Data Types', index=False)
                
                # Sample data
                df.head(100).to_excel(writer, sheet_name='Sample Data', index=False)
            else:
                df.to_excel(writer, sheet_name='Data', index=False)
        
        # Metadata sheet
        if metadata:
            meta_df = pd.DataFrame([
                ['Dataset Name', metadata.get('filename', 'Unknown')],
                ['Upload Date', metadata.get('upload_time', 'Unknown')],
                ['Rows', len(df) if df is not None else 'N/A'],
                ['Columns', len(df.columns) if df is not None else 'N/A']
            ], columns=['Property', 'Value'])
            meta_df.to_excel(writer, sheet_name='Metadata', index=False)
    
    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename="{report_type}_report.xlsx"'
    return response