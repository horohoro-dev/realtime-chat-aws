import pytest
from rest_framework.exceptions import ValidationError

from apps.rooms.models import Membership, Room
from apps.rooms.serializers import MemberSerializer


@pytest.fixture
def alice(django_user_model):
    return django_user_model.objects.create_user(username="alice", password="pass-1234")


@pytest.fixture
def bob(django_user_model):
    return django_user_model.objects.create_user(username="bob", password="pass-1234")


@pytest.fixture
def carol(django_user_model):
    return django_user_model.objects.create_user(username="carol", password="pass-1234")


def make_room(name, creator, members=()):
    room = Room.objects.create(name=name, created_by=creator)
    for user in (creator, *members):
        Membership.objects.create(room=room, user=user)
    return room


def invite(client, room_id, username):
    return client.post(
        f"/api/rooms/{room_id}/members/", {"username": username}, content_type="application/json"
    )


@pytest.mark.django_db
def test_list_returns_members_in_joined_order(client, alice, bob, carol):
    room = make_room("general", alice, members=[carol, bob])
    client.force_login(alice)

    response = client.get(f"/api/rooms/{room.id}/members/")

    assert response.status_code == 200
    body = response.json()
    assert [member["user"]["username"] for member in body] == ["alice", "carol", "bob"]
    assert set(body[0]) == {"user", "joined_at"}
    assert body[0]["user"] == {"id": alice.id, "username": "alice"}


@pytest.mark.django_db
def test_list_orders_by_id_when_joined_at_is_equal(client, alice, bob, carol):
    room = make_room("general", alice, members=[carol, bob])
    same_time = Membership.objects.get(room=room, user=alice).joined_at
    Membership.objects.filter(room=room).update(joined_at=same_time)
    client.force_login(alice)

    response = client.get(f"/api/rooms/{room.id}/members/")

    assert [member["user"]["username"] for member in response.json()] == [
        "alice",
        "carol",
        "bob",
    ]


@pytest.mark.django_db
def test_invite_returns_201_and_invitee_sees_room(client, alice, bob):
    room = make_room("general", alice)
    client.force_login(alice)

    response = invite(client, room.id, "bob")

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"user", "joined_at"}
    assert body["user"] == {"id": bob.id, "username": "bob"}
    assert Membership.objects.filter(room=room, user=bob).exists()

    client.force_login(bob)
    rooms = client.get("/api/rooms/")
    assert [item["id"] for item in rooms.json()] == [room.id]


@pytest.mark.django_db
def test_invite_rejects_unknown_username(client, alice):
    room = make_room("general", alice)
    client.force_login(alice)

    response = invite(client, room.id, "nobody")

    assert response.status_code == 400
    assert "username" in response.json()
    assert Membership.objects.filter(room=room).count() == 1


@pytest.mark.django_db
def test_invite_rejects_existing_member(client, alice, bob):
    room = make_room("general", alice, members=[bob])
    client.force_login(alice)

    response = invite(client, room.id, "bob")

    assert response.status_code == 400
    assert "username" in response.json()
    assert Membership.objects.filter(room=room, user=bob).count() == 1


@pytest.mark.django_db
def test_invite_rejects_inactive_user(client, alice, bob):
    room = make_room("general", alice)
    bob.is_active = False
    bob.save()
    client.force_login(alice)

    response = invite(client, room.id, "bob")

    assert response.status_code == 400
    assert "username" in response.json()
    assert not Membership.objects.filter(room=room, user=bob).exists()


@pytest.mark.django_db
def test_invite_rejects_member_added_after_validation(alice, bob):
    room = make_room("general", alice)
    serializer = MemberSerializer(data={"username": "bob"}, context={"room": room})
    assert serializer.is_valid()
    Membership.objects.create(room=room, user=bob)

    with pytest.raises(ValidationError) as error:
        serializer.save()

    assert "username" in error.value.detail
    assert Membership.objects.filter(room=room, user=bob).count() == 1


@pytest.mark.django_db
def test_invite_rejects_missing_username(client, alice):
    room = make_room("general", alice)
    client.force_login(alice)

    response = client.post(f"/api/rooms/{room.id}/members/", {}, content_type="application/json")

    assert response.status_code == 400
    assert "username" in response.json()


@pytest.mark.django_db
def test_members_api_returns_404_for_non_member(client, alice, bob, carol):
    room = make_room("secret", bob)
    client.force_login(alice)

    assert client.get(f"/api/rooms/{room.id}/members/").status_code == 404
    assert invite(client, room.id, "carol").status_code == 404
    assert not Membership.objects.filter(room=room, user=carol).exists()


@pytest.mark.django_db
def test_members_api_returns_404_for_missing_room(client, alice):
    client.force_login(alice)

    assert client.get("/api/rooms/999999/members/").status_code == 404
    assert invite(client, 999999, "alice").status_code == 404


@pytest.mark.django_db
def test_members_api_returns_403_when_not_logged_in(client, alice):
    room = make_room("general", alice)

    assert client.get(f"/api/rooms/{room.id}/members/").status_code == 403
    assert invite(client, room.id, "alice").status_code == 403
