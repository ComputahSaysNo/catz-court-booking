from rest_framework.authtoken.models import Token


# This graphene middleware adds the request's auth token into info.context, if it exists
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
        return next(root, info, **args)
