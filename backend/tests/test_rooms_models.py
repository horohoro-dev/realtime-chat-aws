import pytest
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError

from apps.rooms.models import Membership, Message, Room


@pytest.fixture
def alice(django_user_model):
    return django_user_model.objects.create_user(username="alice", password="pass-1234")


@pytest.fixture
def bob(django_user_model):
    return django_user_model.objects.create_user(username="bob", password="pass-1234")


@pytest.fixture
def room(alice):
    return Room.objects.create(name="general", created_by=alice)


@pytest.mark.django_db
def test_duplicate_membership_raises_integrity_error(room, alice):
    Membership.objects.create(room=room, user=alice)

    with pytest.raises(IntegrityError), transaction.atomic():
        Membership.objects.create(room=room, user=alice)

    assert Membership.objects.filter(room=room, user=alice).count() == 1


@pytest.mark.django_db
def test_different_users_can_join_same_room(room, alice, bob):
    Membership.objects.create(room=room, user=alice)
    Membership.objects.create(room=room, user=bob)

    assert room.memberships.count() == 2


@pytest.mark.django_db
def test_deleting_room_cascades_to_memberships_and_messages(room, alice):
    Membership.objects.create(room=room, user=alice)
    Message.objects.create(room=room, sender=alice, body="hello")

    room.delete()

    assert Membership.objects.count() == 0
    assert Message.objects.count() == 0


@pytest.mark.django_db
def test_message_body_of_2000_characters_is_saved(room, alice):
    Message.objects.create(room=room, sender=alice, body="a" * 2000)

    assert Message.objects.get().body == "a" * 2000


@pytest.mark.django_db
def test_message_body_over_2000_characters_raises_integrity_error(room, alice):
    with pytest.raises(IntegrityError), transaction.atomic():
        Message.objects.create(room=room, sender=alice, body="a" * 2001)

    assert not Message.objects.exists()


@pytest.mark.django_db
def test_deleting_sender_is_protected(room, alice, bob):
    Message.objects.create(room=room, sender=bob, body="hello")

    with pytest.raises(ProtectedError):
        bob.delete()


@pytest.mark.django_db
def test_deleting_room_creator_is_protected(room, alice):
    with pytest.raises(ProtectedError):
        alice.delete()
