from django.apps import AppConfig


class E2eConfig(AppConfig):
    """E2E テストの準備のコマンドだけを持つ。config.settings.e2e でだけ読み込む。"""

    name = "apps.e2e"
