from django.conf import settings
from django.db import models
from django.db.models.functions import Length
from django.db.models.lookups import LessThanOrEqual

MESSAGE_BODY_MAX_LENGTH = 2000


class Room(models.Model):
    name = models.CharField(max_length=50)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_rooms",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Membership(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = (
            models.UniqueConstraint(fields=["room", "user"], name="unique_membership_room_user"),
        )

    def __str__(self):
        return f"{self.room_id}:{self.user_id}"


class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="sent_messages",
    )
    body = models.TextField(max_length=MESSAGE_BODY_MAX_LENGTH)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = (models.Index(fields=["room", "id"], name="message_room_id_idx"),)
        constraints = (
            models.CheckConstraint(
                condition=LessThanOrEqual(Length("body"), MESSAGE_BODY_MAX_LENGTH),
                name="message_body_max_length",
            ),
        )

    def __str__(self):
        return f"{self.room_id}:{self.id}"
