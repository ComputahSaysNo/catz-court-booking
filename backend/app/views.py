from django.shortcuts import render, redirect
from rest_framework.decorators import api_view
from rest_framework.authtoken.models import Token

# Create your views here.

@api_view(http_method_names=['get'])
def user_token(request):
    print("reached")
    if request.user.is_authenticated:
        print(request.user)
        token, e = Token.objects.get_or_create(user=request.user)
        return redirect('http://localhost:5173/login/?token='+token.key)
    else:
        return redirect('http://localhost:5173/login/?error=true')