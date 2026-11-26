from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics

from apps.rooms.models import Membership, Message, Room
from apps.rooms.serializers import MessageSerializer, RoomSerializer

LATEST_MESSAGE_COUNT = 50


def member_rooms(user):
    return Room.objects.filter(memberships__user=user).select_related("created_by")


class RoomListCreateView(generics.ListCreateAPIView):
    serializer_class = RoomSerializer

    def get_queryset(self):
        return member_rooms(self.request.user).order_by("-created_at", "-id")

    def perform_create(self, serializer):
        with transaction.atomic():
            room = serializer.save(created_by=self.request.user)
            Membership.objects.create(room=room, user=self.request.user)


class RoomDetailView(generics.RetrieveAPIView):
    serializer_class = RoomSerializer
    lookup_url_kwarg = "room_id"

    def get_queryset(self):
        return member_rooms(self.request.user)


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer

    def get_room(self):
        return get_object_or_404(member_rooms(self.request.user), pk=self.kwargs["room_id"])

    def get_queryset(self):
        room = self.get_room()
        latest_ids = (
            Message.objects.filter(room=room).order_by("-id").values("id")[:LATEST_MESSAGE_COUNT]
        )
        return Message.objects.filter(id__in=latest_ids).select_related("sender").order_by("id")

    def perform_create(self, serializer):
        serializer.save(room=self.get_room(), sender=self.request.user)
