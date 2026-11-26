from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.functional import cached_property
from rest_framework import generics

from apps.rooms.models import Membership, Room
from apps.rooms.serializers import MemberSerializer, RoomSerializer


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


class MemberListCreateView(generics.ListCreateAPIView):
    serializer_class = MemberSerializer

    @cached_property
    def room(self):
        return get_object_or_404(member_rooms(self.request.user), pk=self.kwargs["room_id"])

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["room"] = self.room
        return context

    def get_queryset(self):
        return (
            Membership.objects.filter(room=self.room)
            .select_related("user")
            .order_by("joined_at", "id")
        )
