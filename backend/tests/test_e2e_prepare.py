import pytest

from apps.e2e.management.commands.prepare_e2e import ensure_users


@pytest.mark.django_db
def test_ensure_users_creates_users_with_password(django_user_model):
    ensure_users(["e2e-alice", "e2e-bob"], "public-test-password")

    users = django_user_model.objects.order_by("username")
    assert [user.username for user in users] == ["e2e-alice", "e2e-bob"]
    assert all(user.check_password("public-test-password") for user in users)


@pytest.mark.django_db
def test_ensure_users_keeps_existing_user_and_resets_password(django_user_model):
    existing = django_user_model.objects.create_user(username="e2e-alice", password="old")

    ensure_users(["e2e-alice"], "public-test-password")
    ensure_users(["e2e-alice"], "public-test-password")

    user = django_user_model.objects.get(username="e2e-alice")
    assert user.pk == existing.pk
    assert user.check_password("public-test-password")
    assert django_user_model.objects.count() == 1
