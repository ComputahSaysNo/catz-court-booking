from rest_framework.authtoken.models import Token


class DRFAuthorizationMiddleware(object):
    def __init__(self):
        pass

    def resolve(self, next, root, info, **args):
        if info.context.user.is_authenticated:
            # HUGE speedup. Otherwise, this middleware gets called loads of times,
            # looking up the token in the DB every time
            return next(root, info, **args)
        auth_header = info.context.META.get("HTTP_AUTHORIZATION")
        if auth_header:
            token = auth_header.split('Token ')[1]
            user = Token.objects.get(key=token).user
            info.context.user = user
        print("s9")
        return next(root, info, **args)
