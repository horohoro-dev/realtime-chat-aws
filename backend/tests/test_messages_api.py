import pytest

from apps.rooms.models import Membership, Message, Room


@pytest.fixture
def alice(django_user_model):
    return django_user_model.objects.create_user(username="alice", password="pass-1234")


@pytest.fixture
def bob(django_user_model):
    return django_user_model.objects.create_user(username="bob", password="pass-1234")


def make_room(name, creator, members=()):
    room = Room.objects.create(name=name, created_by=creator)
    for user in (creator, *members):
        Membership.objects.create(room=room, user=user)
    return room


def post_message(client, room, body):
    return client.post(
        f"/api/rooms/{room.id}/messages/", {"body": body}, content_type="application/json"
    )


@pytest.mark.django_db
def test_list_returns_latest_50_messages_oldest_first(client, alice, bob):
    room = make_room("general", alice, members=[bob])
    other = make_room("other", alice)
    Message.objects.create(room=other, sender=alice, body="other room")
    messages = [
        Message.objects.create(room=room, sender=alice if i % 2 else bob, body=f"m{i}")
        for i in range(51)
    ]
    client.force_login(alice)

    response = client.get(f"/api/rooms/{room.id}/messages/")

    assert response.status_code == 200
    body = response.json()
    assert [m["id"] for m in body] == [m.id for m in messages[1:]]
    assert body[0]["body"] == "m1"
    assert body[-1]["body"] == "m50"
    assert set(body[0]) == {"id", "sender", "body", "created_at"}
    assert body[0]["sender"] == {"id": alice.id, "username": "alice"}


@pytest.mark.django_db
def test_list_returns_empty_array_when_no_messages(client, alice):
    room = make_room("general", alice)
    client.force_login(alice)

    response = client.get(f"/api/rooms/{room.id}/messages/")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.django_db
def test_create_returns_201_and_sets_sender_to_logged_in_user(client, alice, bob):
    room = make_room("general", alice, members=[bob])
    client.force_login(alice)

    response = client.post(
        f"/api/rooms/{room.id}/messages/",
        {"body": "hello", "sender": bob.id},
        content_type="application/json",
    )

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "sender", "body", "created_at"}
    assert body["body"] == "hello"
    assert body["sender"] == {"id": alice.id, "username": "alice"}
    message = Message.objects.get(id=body["id"])
    assert message.room_id == room.id
    assert message.sender_id == alice.id


@pytest.mark.django_db
def test_create_trims_surrounding_whitespace(client, alice):
    room = make_room("general", alice)
    client.force_login(alice)

    response = post_message(client, room, "  hello  ")

    assert response.status_code == 201
    assert response.json()["body"] == "hello"
    assert Message.objects.get().body == "hello"


@pytest.mark.django_db
def test_create_accepts_2000_characters(client, alice):
    room = make_room("general", alice)
    client.force_login(alice)

    assert post_message(client, room, "a" * 2000).status_code == 201


@pytest.mark.django_db
@pytest.mark.parametrize("body", ["", "   ", "a" * 2001])
def test_create_rejects_invalid_body(client, alice, body):
    room = make_room("general", alice)
    client.force_login(alice)

    response = post_message(client, room, body)

    assert response.status_code == 400
    assert "body" in response.json()
    assert not Message.objects.exists()


@pytest.mark.django_db
def test_list_and_create_return_404_for_non_member(client, alice, bob):
    room = make_room("secret", bob)
    Message.objects.create(room=room, sender=bob, body="hidden")
    client.force_login(alice)

    assert client.get(f"/api/rooms/{room.id}/messages/").status_code == 404
    assert post_message(client, room, "hi").status_code == 404
    assert post_message(client, room, "   ").status_code == 404
    assert Message.objects.count() == 1


@pytest.mark.django_db
def test_list_and_create_return_404_for_missing_room(client, alice):
    client.force_login(alice)

    assert client.get("/api/rooms/999999/messages/").status_code == 404
    response = client.post(
        "/api/rooms/999999/messages/", {"body": "hi"}, content_type="application/json"
    )
    assert response.status_code == 404
    response = client.post(
        "/api/rooms/999999/messages/", {"body": ""}, content_type="application/json"
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_messages_api_returns_403_when_not_logged_in(client, alice):
    room = make_room("general", alice)

    assert client.get(f"/api/rooms/{room.id}/messages/").status_code == 403
    assert post_message(client, room, "hi").status_code == 403
