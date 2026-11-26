from django.db import transaction
from rest_framework import generics

from apps.rooms.models import Membership, Room
from apps.rooms.serializers import RoomSerializer


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
