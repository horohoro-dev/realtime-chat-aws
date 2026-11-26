from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.rooms.models import Message, Room


class RoomSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Room
        fields = ("id", "name", "created_by", "created_at")
        read_only_fields = ("id", "created_by", "created_at")


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ("id", "sender", "body", "created_at")
        read_only_fields = ("id", "sender", "created_at")
