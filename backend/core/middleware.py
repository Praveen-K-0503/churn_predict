import json
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

logger = logging.getLogger(__name__)

class ErrorHandlingMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        if request.path.startswith('/api/'):
            logger.error(f"API Error: {str(exception)}", exc_info=True)
            return JsonResponse({
                'error': 'Internal server error',
                'message': str(exception) if settings.DEBUG else 'Something went wrong',
                'status': 'error'
            }, status=500)
        return None