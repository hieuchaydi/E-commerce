from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductImageUploadView, UserViewSet, CategoryViewSet, ProductViewSet,
    CartViewSet, OrderViewSet, ReviewViewSet, DiscountCodeViewSet,
    LoginView, LogoutView, RegisterView,
    CurrentUserView, AdminStatsView, ClearCartView,
    ForgotPasswordView, ResetPasswordView, ChangePasswordView,
    MessageViewSet, PublicUserView
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
router.register(r'discounts', DiscountCodeViewSet, basename='discount')
router.register(r'messages', MessageViewSet, basename='messages')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/user/', CurrentUserView.as_view(), name='current-user'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('products/<int:product_pk>/reviews/', 
         ReviewViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='product-reviews'),
    path('products/<int:pk>/upload_image/', ProductImageUploadView.as_view(), name='upload-product-image'),
    path('cart/clear/', ClearCartView.as_view(), name='clear-cart'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('admin/users/<int:pk>/', PublicUserView.as_view(), name='public-user'),
    path('', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)