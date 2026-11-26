from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.serializers import UserSerializer


@extend_schema(responses=UserSerializer)
@api_view(["GET"])
def me(request: Request) -> Response:
    return Response(UserSerializer(request.user).data)
