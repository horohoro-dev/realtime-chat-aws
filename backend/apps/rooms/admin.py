from django.contrib import admin

from apps.rooms.models import Membership, Message, Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_by", "created_at")
    list_select_related = ("created_by",)
    raw_id_fields = ("created_by",)


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("id", "room", "user", "joined_at")
    list_select_related = ("room", "user")
    raw_id_fields = ("room", "user")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "room", "sender", "created_at")
    list_select_related = ("room", "sender")
    raw_id_fields = ("room", "sender")
