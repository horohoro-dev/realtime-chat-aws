from django.db import IntegrityError, transaction
from rest_framework import serializers

from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer
from apps.rooms.models import Membership, Message, Room


class RoomSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Room
        fields = ("id", "name", "created_by", "created_at")
        read_only_fields = ("id", "created_by", "created_at")


class MemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(write_only=True)

    class Meta:
        model = Membership
        fields = ("user", "joined_at", "username")
        read_only_fields = ("user", "joined_at")

    def validate(self, attrs):
        username = attrs.pop("username")
        # 無効にされた利用者はログインできないので、いない利用者と同じに扱う
        user = User.objects.filter(username=username, is_active=True).first()
        if user is None:
            raise serializers.ValidationError({"username": ["この利用者名の利用者はいません。"]})
        if Membership.objects.filter(room=self.context["room"], user=user).exists():
            raise serializers.ValidationError({"username": ["すでにこのルームのメンバーです。"]})
        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        try:
            with transaction.atomic():
                return Membership.objects.create(
                    room=self.context["room"], user=validated_data["user"]
                )
        except IntegrityError as error:
            raise serializers.ValidationError(
                {"username": ["すでにこのルームのメンバーです。"]}
            ) from error


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ("id", "sender", "body", "created_at")
        read_only_fields = ("id", "sender", "created_at")
