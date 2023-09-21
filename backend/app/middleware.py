from rest_framework.authtoken.models import Token


class DRFAuthorizationMiddleware(object):
    def __init__(self):
        pass

    def resolve(self, next, root, info, **args):
        auth_header = info.context.META.get("HTTP_AUTHORIZATION")
        if auth_header:
            token = auth_header.split('Token ')[1]
            user = Token.objects.get(key=token).user
            info.context.user = user
        return next(root, info, **args)
