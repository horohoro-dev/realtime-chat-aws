import pytest

from apps.rooms.models import Membership, Room


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


@pytest.mark.django_db
def test_list_returns_only_member_rooms_newest_first(client, alice, bob):
    first = make_room("first", alice)
    make_room("others", bob)
    third = make_room("third", bob, members=[alice])
    client.force_login(alice)

    response = client.get("/api/rooms/")

    assert response.status_code == 200
    assert [room["id"] for room in response.json()] == [third.id, first.id]


@pytest.mark.django_db
def test_create_returns_201_and_registers_creator_as_member(client, alice):
    client.force_login(alice)

    response = client.post("/api/rooms/", {"name": "general"}, content_type="application/json")

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "name", "created_by", "created_at"}
    assert body["name"] == "general"
    assert body["created_by"] == {"id": alice.id, "username": "alice"}
    assert Membership.objects.filter(room_id=body["id"], user=alice).exists()


@pytest.mark.django_db
def test_create_ignores_created_by_in_body(client, alice, bob):
    client.force_login(alice)

    response = client.post(
        "/api/rooms/",
        {"name": "general", "created_by": bob.id},
        content_type="application/json",
    )

    assert response.status_code == 201
    assert response.json()["created_by"]["id"] == alice.id


@pytest.mark.django_db
@pytest.mark.parametrize("name", ["", "   ", "a" * 51])
def test_create_rejects_invalid_name(client, alice, name):
    client.force_login(alice)

    response = client.post("/api/rooms/", {"name": name}, content_type="application/json")

    assert response.status_code == 400
    assert "name" in response.json()
    assert not Room.objects.exists()


@pytest.mark.django_db
def test_create_accepts_50_characters(client, alice):
    client.force_login(alice)

    response = client.post("/api/rooms/", {"name": "a" * 50}, content_type="application/json")

    assert response.status_code == 201


@pytest.mark.django_db
def test_create_trims_surrounding_whitespace(client, alice):
    client.force_login(alice)

    response = client.post("/api/rooms/", {"name": "  general  "}, content_type="application/json")

    assert response.status_code == 201
    assert response.json()["name"] == "general"
    assert Room.objects.get().name == "general"


@pytest.mark.django_db
def test_detail_returns_room_for_member(client, alice):
    room = make_room("general", alice)
    client.force_login(alice)

    response = client.get(f"/api/rooms/{room.id}/")

    assert response.status_code == 200
    assert response.json()["id"] == room.id
    assert response.json()["created_by"] == {"id": alice.id, "username": "alice"}


@pytest.mark.django_db
def test_detail_returns_404_for_non_member(client, alice, bob):
    room = make_room("secret", bob)
    client.force_login(alice)

    response = client.get(f"/api/rooms/{room.id}/")

    assert response.status_code == 404


@pytest.mark.django_db
def test_detail_returns_404_for_missing_room(client, alice):
    client.force_login(alice)

    response = client.get("/api/rooms/999999/")

    assert response.status_code == 404


@pytest.mark.django_db
def test_rooms_api_returns_403_when_not_logged_in(client, alice):
    room = make_room("general", alice)

    assert client.get("/api/rooms/").status_code == 403
    assert (
        client.post("/api/rooms/", {"name": "x"}, content_type="application/json").status_code
        == 403
    )
    assert client.get(f"/api/rooms/{room.id}/").status_code == 403
