import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import User


@pytest.mark.django_db
def test_me_returns_logged_in_user(client, django_user_model):
    user = django_user_model.objects.create_user(username="alice", password="pass-1234")
    client.force_login(user)

    response = client.get("/api/me/")

    assert response.status_code == 200
    assert response.json() == {"id": user.id, "username": "alice"}


@pytest.mark.django_db
def test_me_returns_403_when_not_logged_in(client):
    response = client.get("/api/me/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_login_page_is_served(client):
    response = client.get("/api/auth/login/")

    assert response.status_code == 200


@pytest.mark.django_db
def test_login_without_next_redirects_to_me(client, django_user_model):
    django_user_model.objects.create_user(username="alice", password="pass-1234")

    response = client.post(
        "/api/auth/login/", {"username": "alice", "password": "pass-1234"}, follow=True
    )

    assert response.redirect_chain[-1][0] == "/api/me/"
    assert response.status_code == 200
    assert response.json()["username"] == "alice"


def test_user_model_is_accounts_user():
    assert get_user_model() is User
