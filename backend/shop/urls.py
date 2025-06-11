from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductImageUploadView, UserViewSet, CategoryViewSet, ProductViewSet,
    CartViewSet, OrderViewSet, ReviewViewSet,
    LoginView, LogoutView, RegisterView,
    CurrentUserView, AdminStatsView, ClearCartView,
    ForgotPasswordView, ResetPasswordView
)
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'admin/users', UserViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'reviews', ReviewViewSet, basename='reviews')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/user/', CurrentUserView.as_view(), name='current-user'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('products/<int:product_pk>/reviews/', 
         ReviewViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='product-reviews'),
    path('products/<int:pk>/upload_image/', ProductImageUploadView.as_view(), name='upload-product-image'),
    path('cart/clear/', ClearCartView.as_view(), name='clear-cart'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)