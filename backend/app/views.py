from django.shortcuts import render, redirect
from rest_framework.decorators import api_view
from rest_framework.authtoken.models import Token

# Create your views here.

@api_view(http_method_names=['get'])
def user_token(request):
    if request.user.is_authenticated:
        token, e = Token.objects.get_or_create(user=request.user)
        return redirect('https://km814.user.srcf.net/?token='+token.key)
    else:
        return redirect('https://km814.user.srcf.net/?error=true')