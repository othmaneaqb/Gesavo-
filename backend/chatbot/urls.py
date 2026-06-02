from django.urls import path
from .views import ChatbotActionView, ChatbotMessageView

urlpatterns = [
    path('message/', ChatbotMessageView.as_view(), name='chatbot_message'),
    path('action/', ChatbotActionView.as_view(), name='chatbot_action'),
]
