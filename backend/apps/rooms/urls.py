from django.urls import path

from apps.rooms import views

urlpatterns = [
    path("rooms/", views.RoomListCreateView.as_view(), name="room-list"),
    path("rooms/<int:room_id>/", views.RoomDetailView.as_view(), name="room-detail"),
    path(
        "rooms/<int:room_id>/members/",
        views.MemberListCreateView.as_view(),
        name="member-list",
    ),
    path(
        "rooms/<int:room_id>/messages/",
        views.MessageListCreateView.as_view(),
        name="message-list",
    ),
]
