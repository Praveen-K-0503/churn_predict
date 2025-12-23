from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch

# Initialize the model (using a lightweight model suitable for analytics)
try:
    # Use DialoGPT for conversational AI or CodeT5 for technical discussions
    model_name = "microsoft/DialoGPT-medium"  # Good for conversations
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    # Add padding token if not present
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    chatbot = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_length=200,
        do_sample=True,
        temperature=0.7,
        pad_token_id=tokenizer.eos_token_id
    )
    
    MODEL_LOADED = True
except Exception as e:
    print(f"Error loading Hugging Face model: {e}")
    MODEL_LOADED = False

@csrf_exempt
def chat_with_ai(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_message = data.get('message', '')
            context = data.get('context', {})  # Training results, dataset info
            
            if not user_message:
                return JsonResponse({'error': 'Message is required'}, status=400)
            
            # Create context-aware prompt
            prompt = create_analytics_prompt(user_message, context)
            
            if MODEL_LOADED:
                try:
                    # Generate response using Hugging Face model
                    response = chatbot(prompt, max_new_tokens=100, num_return_sequences=1)
                    ai_response = response[0]['generated_text']
                    
                    # Clean up the response
                    ai_response = clean_response(ai_response, prompt)
                    
                except Exception as e:
                    print(f"Model generation error: {e}")
                    ai_response = generate_fallback_response(user_message, context)
            else:
                ai_response = generate_fallback_response(user_message, context)
            
            return JsonResponse({
                'response': ai_response,
                'model_used': 'huggingface' if MODEL_LOADED else 'fallback'
            })
            
        except Exception as e:
            return JsonResponse({'error': f'Chat failed: {str(e)}'}, status=500)
    
    return JsonResponse({'message': 'AI Chat endpoint'})

def create_analytics_prompt(user_message, context):
    """Create a context-aware prompt for analytics discussions"""
    
    # Base context about the system
    base_context = """You are ChurnGuard AI, an expert assistant for telecom customer churn prediction analytics. 
You help users understand machine learning models, dataset insights, and business recommendations.
"""
    
    # Add dynamic dataset context if available
    if context.get('eda_results'):
        eda = context['eda_results']
        dataset_context = f"""
Current Dataset Analysis:
- Total Customers: {eda.get('dataset_info', {}).get('rows', 'N/A')}
- Features: {eda.get('dataset_info', {}).get('columns', 'N/A')}
- Missing Values: {len(eda.get('missing_values', {}))}
- Data Quality: {'Good' if len(eda.get('missing_values', {})) < 5 else 'Needs cleaning'}
"""
        base_context += dataset_context
    
    # Add cleaning results context
    if context.get('cleaning_results'):
        cleaning = context['cleaning_results']
        cleaning_context = f"""
Data Cleaning Results:
- Original Rows: {cleaning.get('original_rows', 'N/A')}
- Cleaned Rows: {cleaning.get('cleaned_rows', 'N/A')}
- Duplicates Removed: {cleaning.get('duplicates_removed', 0)}
- Outliers Detected: {cleaning.get('outliers_detected', 0)}
"""
        base_context += cleaning_context
    
    # Add training results context if available
    if context.get('training_results'):
        results = context['training_results']
        models = results.get('models', [])
        if models:
            best_model = models[0]
            model_context = f"""
Current Models Trained:
- Best Model: {best_model.get('name', 'Unknown')}
- Best Accuracy: {best_model.get('accuracy', 0) * 100:.1f}%
- F1 Score: {best_model.get('f1_score', 0) * 100:.1f}%
- Total Models: {len(models)}
"""
            base_context += model_context
    
    # Add feature importance if available
    if context.get('feature_importance'):
        features = context['feature_importance'][:3]  # Top 3
        feature_context = f"""
Top Predictive Features:
{chr(10).join([f'- {f.get("feature", "Unknown")}: {f.get("importance", 0) * 100:.1f}%' for f in features])}
"""
        base_context += feature_context
    
    # Add current page context
    page_context = context.get('page', 'general')
    if page_context == 'training':
        base_context += "\nContext: User is on the Model Training page."
    elif page_context == 'eda':
        base_context += "\nContext: User is on the Data Cleaning & EDA page."
    
    # Create the full prompt
    prompt = f"""{base_context}

User Question: {user_message}

AI Response:"""
    
    return prompt

def clean_response(generated_text, original_prompt):
    """Clean and extract the AI response from generated text"""
    
    # Remove the original prompt from the response
    if "AI Response:" in generated_text:
        response = generated_text.split("AI Response:")[-1].strip()
    else:
        response = generated_text.replace(original_prompt, "").strip()
    
    # Clean up common issues
    response = response.replace("User Question:", "").strip()
    response = response.split("User:")[0].strip()  # Stop at next user input
    response = response.split("\n\n")[0].strip()  # Take first paragraph
    
    # Limit length
    if len(response) > 300:
        response = response[:300] + "..."
    
    return response if response else "I'd be happy to help you with your churn prediction analysis. What specific aspect would you like to explore?"

def generate_fallback_response(user_message, context):
    """Generate intelligent fallback responses when HF model isn't available"""
    
    q = user_message.lower()
    
    # Dynamic responses based on actual data
    if context.get('eda_results'):
        eda = context['eda_results']
        dataset_info = eda.get('dataset_info', {})
        
        if any(word in q for word in ['data', 'dataset', 'rows', 'size']):
            return f"Your current dataset has {dataset_info.get('rows', 'N/A')} customers with {dataset_info.get('columns', 'N/A')} features. Memory usage is {dataset_info.get('memory_usage', 'N/A')}. The data quality looks {'good' if len(eda.get('missing_values', {})) < 5 else 'fair - some cleaning needed'}."
    
    if context.get('cleaning_results'):
        cleaning = context['cleaning_results']
        if any(word in q for word in ['clean', 'quality', 'missing']):
            return f"Data cleaning completed! Processed {cleaning.get('original_rows', 'N/A')} rows, removed {cleaning.get('duplicates_removed', 0)} duplicates, and detected {cleaning.get('outliers_detected', 0)} outliers. {len(cleaning.get('missing_values', {}))} columns had missing values that were handled."
    
    # Model performance questions with real data
    if any(word in q for word in ['best', 'top', 'model', 'performance', 'accuracy']):
        if context.get('training_results'):
            results = context['training_results']
            models = results.get('models', [])
            if models:
                best = models[0]
                return f"Your best model is {best.get('name', 'Unknown')} with {best.get('accuracy', 0) * 100:.1f}% accuracy and {best.get('f1_score', 0) * 100:.1f}% F1 score. You trained {len(models)} models total. This performance is {'excellent' if best.get('accuracy', 0) > 0.9 else 'good' if best.get('accuracy', 0) > 0.8 else 'fair'} for churn prediction."
        return "Train your models first to see performance metrics. I can then provide detailed analysis of which algorithms work best for your specific dataset."
    
    # Feature importance with real data
    if any(word in q for word in ['feature', 'important', 'predict', 'factor']):
        if context.get('feature_importance'):
            features = context['feature_importance'][:5]
            feature_list = '\n'.join([f"{i+1}. {f.get('feature', 'Unknown')}: {f.get('importance', 0) * 100:.1f}% importance" for i, f in enumerate(features)])
            return f"Based on your trained models, the most important features are:\n\n{feature_list}\n\nThese features have the strongest predictive power for your specific dataset."
        return "Feature importance will be available after training your models. The system will analyze which customer characteristics are most predictive of churn."
    
    # Page-specific responses
    page = context.get('page', 'general')
    if page == 'eda':
        if any(word in q for word in ['help', 'what', 'how']):
            return "I can help you with data analysis! Ask me about:\n\n• Dataset characteristics and quality\n• Data cleaning results and recommendations\n• Statistical insights and patterns\n• Visualization interpretations\n• Next steps for model training\n\nWhat aspect of your data would you like to explore?"
    elif page == 'training':
        if any(word in q for word in ['help', 'what', 'how']):
            return "I can help with model training! Ask me about:\n\n• Model performance comparisons\n• Feature importance analysis\n• Algorithm recommendations\n• Training optimization tips\n• Business insights from results\n\nWhat would you like to know about your models?"
    
    # Default contextual response
    if context.get('training_results') and context.get('eda_results'):
        return "I have access to both your data analysis and model training results! I can discuss data quality, model performance, feature importance, and business recommendations. What specific insights are you looking for?"
    elif context.get('eda_results'):
        return "I can see your data analysis results! Ask me about dataset characteristics, data quality, cleaning recommendations, or insights from your exploratory analysis."
    elif context.get('training_results'):
        return "I can see your model training results! Ask me about model performance, feature importance, algorithm comparisons, or business recommendations based on your results."
    
    return "I'm here to help with your churn prediction analysis! I can discuss data quality, model performance, feature importance, and business insights. What would you like to explore?"

# Alternative: Use a smaller, faster model for production
def initialize_lightweight_model():
    """Initialize a lightweight model for faster responses"""
    try:
        # Use DistilGPT-2 for faster inference
        model_name = "distilgpt2"
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(model_name)
        
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            
        return pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_length=150,
            do_sample=True,
            temperature=0.8
        )
    except Exception as e:
        print(f"Error loading lightweight model: {e}")
        return None