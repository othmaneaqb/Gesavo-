from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ChatActionSerializer, ChatMessageSerializer
from .services import answer_message, execute_action


class ChatbotMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = answer_message(
            request.user,
            serializer.validated_data['message'],
            language=serializer.validated_data.get('language', 'fr'),
            history=serializer.validated_data.get('history', []),
        )
        return Response(result, status=status.HTTP_200_OK)


class ChatbotActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChatActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = execute_action(
            request.user,
            serializer.validated_data['type'],
            serializer.validated_data['payload'],
            language=serializer.validated_data.get('language', 'fr'),
        )
        return Response(result, status=status.HTTP_200_OK)
