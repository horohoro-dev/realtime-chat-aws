from django.urls import path

from apps.rooms import views

urlpatterns = [
    path("rooms/", views.RoomListCreateView.as_view(), name="room-list"),
    path("rooms/<int:room_id>/", views.RoomDetailView.as_view(), name="room-detail"),
]
