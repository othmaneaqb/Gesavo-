from rest_framework import serializers


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)
    language = serializers.ChoiceField(choices=['fr', 'en', 'ar'], required=False, default='fr')
    history = serializers.ListField(required=False, child=serializers.DictField(), max_length=12)


class ChatActionSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=[
        'create_task',
        'add_note',
        'update_task_status',
        'update_case_status',
    ])
    label = serializers.CharField(max_length=200)
    language = serializers.ChoiceField(choices=['fr', 'en', 'ar'], required=False, default='fr')
    payload = serializers.DictField()
