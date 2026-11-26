from django.db import IntegrityError, transaction
from rest_framework import serializers

from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer
from apps.rooms.models import Membership, Room


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

    def validate_username(self, value):
        user = User.objects.filter(username=value).first()
        if user is None:
            raise serializers.ValidationError("この利用者名の利用者はいません。")
        if Membership.objects.filter(room=self.context["room"], user=user).exists():
            raise serializers.ValidationError("すでにこのルームのメンバーです。")
        return user

    def create(self, validated_data):
        try:
            with transaction.atomic():
                return Membership.objects.create(
                    room=self.context["room"], user=validated_data["username"]
                )
        except IntegrityError as error:
            raise serializers.ValidationError(
                {"username": ["すでにこのルームのメンバーです。"]}
            ) from error
