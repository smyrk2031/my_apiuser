from django.urls import path
from . import views
from .views import clip_org, clip_org_bg, clip_org_practice, clip_org_production
from .views import anime2sketch, anime2sketch_bg

#app_name = "voice"
app_name = "instead"
urlpatterns = [
    path('', views.index, name='index'),
    #path('index/', views.index, name='test'),
    path('whisper_v2t/', views.whisper_v2t, name='whisper_v2t'),

    path('clip_org/', views.clip_org, name="clip_org"),
    path('clip_org_practice/', views.clip_org_practice, name="clip_org_practice"),
    path('clip_org_production/', views.clip_org_production, name="clip_org_production"),
    path('clip_org/clip_org_bg/', views.clip_org_bg, name='clip_org_bg'),
    #path('clip_org_bg/', views.clip_org_bg, name='clip_org_bg'),
    #path('', clip_org_bg, name='clip_org_bg'),    # Ajax

    path('anime2sketch/', views.anime2sketch),
    path('anime2sketch/anime2sketch_bg/', views.anime2sketch_bg, name='anime2sketch_bg'),
]