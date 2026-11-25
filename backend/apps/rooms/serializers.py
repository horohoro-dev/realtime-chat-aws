from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.rooms.models import Room


class RoomSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Room
        fields = ("id", "name", "created_by", "created_at")
        read_only_fields = ("id", "created_by", "created_at")
