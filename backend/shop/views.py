from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.urls import reverse
from .models import PasswordResetCode
from django.contrib.auth.models import User
from django.conf import settings
from .models import PasswordResetCode, DiscountCode
from django.db.models import Avg, Count
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser
from django.db.models import Count
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Category, Product, Cart, Order, OrderItem, Review
from .serializers import (
    DiscountCodeSerializer, UserSerializer, CategorySerializer, ProductSerializer,
    CartSerializer, OrderSerializer, ReviewSerializer
)
from django.db import transaction
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from .serializers import ProductSerializer
from rest_framework import serializers
from django.utils import timezone
from django.utils.text import slugify
from rest_framework.permissions import BasePermission
import os
from django.db.models import Sum
from django.contrib.auth import get_user_model
User = get_user_model()

from .serializers import ProductSerializer

class IsSellerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        print('User:', request.user, 'Role:', request.user.role if request.user.is_authenticated else 'None')
        if request.method in permissions.SAFE_METHODS:
            return True  # Allow all users (authenticated or not) for GET, HEAD, OPTIONS
        return request.user.is_authenticated and request.user.role in ['seller', 'admin']
class IsProductOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.role == 'admin' or obj.seller == request.user
    
    
    
class IsOrderRelatedToSellerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if request.user.role == 'seller':
            # Kiểm tra xem đơn hàng có chứa sản phẩm của seller không
            return obj.items.filter(product__seller=request.user).exists()
        return obj.user == request.user
    
# views.py
class SellerListView(APIView):
    def get(self, request):
        query = request.query_params.get('query', '')
        sellers = User.objects.filter(role='seller', username__icontains=query).values('username')
        return Response(sellers)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related('category', 'seller')
    serializer_class = ProductSerializer
    permission_classes = [IsSellerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'product_type']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'sold_count']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['retrieve', 'list']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print('Lỗi xác thực:', serializer.errors)
            return Response(serializer.errors, status=400)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated and self.request.user.role == 'seller':
            queryset = queryset.filter(seller=self.request.user)

        # Lọc theo tên seller
        seller_name = self.request.query_params.get('seller')
        if seller_name:
            queryset = queryset.filter(seller__username__icontains=seller_name)

        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        min_rating = self.request.query_params.get('min_rating')
        product_type = self.request.query_params.get('product_type')

        if min_price:
            queryset = queryset.filter(price__gte=min_price

);
        if max_price:
            queryset = queryset.filter(price__lte=max_price);
        if min_rating:
            queryset = queryset.annotate(avg_rating=Avg('reviews__rating')).filter(avg_rating__gte=min_rating)
        if product_type:
            queryset = queryset.filter(product_type=product_type)

        return queryset
    
class LoginView(ObtainAuthToken):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'role': user.role
        })

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
            response = Response(status=status.HTTP_200_OK)
            if hasattr(request, 'session'):
                request.session.flush()
            return response
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = Token.objects.create(user=user)
            return Response({
                'token': token.key,
                'user': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        if not current_password or not new_password:
            return Response(
                {'error': 'Cả mật khẩu hiện tại và mật khẩu mới đều bắt buộc'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not request.user.check_password(current_password):
            return Response(
                {'error': 'Mật khẩu hiện tại không đúng'},
                status=status.HTTP_400_BAD_REQUEST
            )
        request.user.set_password(new_password)
        request.user.save()
        return Response({'message': 'Đổi mật khẩu thành công'}, status=status.HTTP_200_OK)

class AdminStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        revenue = Order.objects.filter(status='completed').aggregate(
            total_revenue=Sum('total_price')
        )['total_revenue'] or 0

        stats = {
            'totalUsers': User.objects.count(),
            'totalProducts': Product.objects.count(),
            'totalOrders': Order.objects.count(),
            'revenue': float(revenue),
            'recent_orders': OrderSerializer(
                Order.objects.order_by('-created_at')[:5], many=True
            ).data,
            'top_products': Product.objects.annotate(
                order_count=Count('orderitem')
            ).order_by('-order_count')[:5].values('id', 'name', 'order_count')
        }
        return Response(stats)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

# views.py

class ProductSerializer(serializers.ModelSerializer):
    price = serializers.FloatField()  # Already fixed
    avg_rating = serializers.SerializerMethodField()
    sold_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'quantity', 'category', 'image', 'description', 'seller', 'avg_rating', 'sold_count']
    
    def get_avg_rating(self, obj):
        try:
            avg = obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
            return round(avg, 2) if avg is not None else 0.0
        except Exception as e:
            print(f"Error in get_avg_rating: {e}")
            return 0.0

    def get_sold_count(self, obj):
        try:
            return obj.orderitem_set.aggregate(total_sold=Count('quantity'))['total_sold'] or 0
        except Exception as e:
            print(f"Error in get_sold_count: {e}")
            return 0

class CartSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'user', 'product', 'product_id', 'quantity', 'created_at', 'total_price']
        read_only_fields = ['user', 'created_at', 'total_price']

    def get_total_price(self, obj):
        try:
            return float(obj.total_price) if obj.total_price is not None else 0.0
        except Exception as e:
            print(f"Error in get_total_price: {e}")
            return 0.0

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data['product']
        quantity = serializer.validated_data.get('quantity', 1)
        try:
            product = Product.objects.get(id=product.id)
        except Product.DoesNotExist:
            return Response({'error': 'Sản phẩm không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
        cart_item, created = Cart.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        output_serializer = self.get_serializer(cart_item)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsOrderRelatedToSellerOrAdmin]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Order.objects.all().prefetch_related('items__product')
        elif self.request.user.role == 'seller':
            return Order.objects.filter(items__product__seller=self.request.user).distinct().prefetch_related('items__product')
        return Order.objects.filter(user=self.request.user).prefetch_related('items__product')

    def create(self, request, *args, **kwargs):
        cart_items = Cart.objects.filter(user=request.user)
        if not cart_items.exists():
            return Response({'error': 'Giỏ hàng trống'}, status=status.HTTP_400_BAD_REQUEST)
        
        total_price = float(sum(item.total_price for item in cart_items))
        
        # Xác thực mã giảm giá
        discount_code_str = request.data.get('discount_code')
        discount_amount = 0
        discount_code = None
        if discount_code_str:
            try:
                with transaction.atomic():
                    discount_code = DiscountCode.objects.select_for_update().get(code=discount_code_str)
                    if not discount_code.is_valid(request.user, total_price):
                        return Response({'error': 'Mã giảm giá không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)
                    discount_amount = float(discount_code.discount_amount)
                    if discount_code.max_usage > 0 and discount_code.usage_count >= discount_code.max_usage:
                        return Response({'error': 'Mã giảm giá đã đạt giới hạn sử dụng'}, status=status.HTTP_400_BAD_REQUEST)
                    discount_code.usage_count += 1
                    discount_code.save()
            except DiscountCode.DoesNotExist:
                return Response({'error': 'Mã giảm giá không tồn tại'}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(
            user=request.user,
            total_price=total_price - discount_amount,
            shipping_address=request.data.get('shipping_address', ''),
            payment_method=request.data.get('payment_method', 'COD'),
            discount_code=discount_code,
            discount_amount=discount_amount
        )

        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )

        # Gửi email xác nhận
        subject = 'Xác nhận đơn hàng'
        message = f"""
        Cảm ơn bạn đã đặt hàng!
        - Mã đơn hàng: {order.id}
        - Tổng giá: ${order.total_price}
        - Địa chỉ giao hàng: {order.shipping_address}
        """
        from_email = settings.EMAIL_HOST_USER
        to_email = [request.user.email]
        send_mail(subject, message, from_email, to_email, fail_silently=True)

        cart_items.delete()
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # Loại bỏ @action cho retrieve, giữ nguyên logic mặc định
    def retrieve(self, request, pk=None):
        order = self.get_object()
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    # Thêm action tùy chỉnh nếu cần (ví dụ: update_status)
    @action(detail=True, methods=['patch'], url_path='status')
    def update_order_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
from .models import DiscountCode
from .serializers import DiscountCodeSerializer
import logging

# Cấu hình logging
logger = logging.getLogger(__name__)

class DiscountCodeViewSet(viewsets.ModelViewSet):
    queryset = DiscountCode.objects.all()
    serializer_class = DiscountCodeSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['post'], url_path='validate', permission_classes=[permissions.IsAuthenticated])
    def validate(self, request):
        code = request.data.get('code')
        order_total = request.data.get('order_total', 0)

        # Debug: In dữ liệu nhận được
        logger.info(f"Received data: code={code}, order_total={order_total}, user={request.user.username}")

        if not code:
            logger.error("Missing 'code' field in request data")
            return Response(
                {'error': 'Trường "code" là bắt buộc'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order_total = float(order_total)
            logger.info(f"Converted order_total to float: {order_total}")
            if order_total < 0:
                logger.error(f"Invalid order_total: {order_total}")
                return Response(
                    {'error': 'Trường "order_total" phải là số không âm'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            discount_code = DiscountCode.objects.get(code=code)
            logger.info(f"Found discount code: {discount_code.code}, is_active={discount_code.is_active}, usage_count={discount_code.usage_count}")

            if not discount_code.is_valid(request.user, order_total):
                logger.warning(f"Discount code invalid for user {request.user.username}: {discount_code.__dict__}")
                return Response(
                    {'error': 'Mã giảm giá không hợp lệ hoặc đã hết hạn'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = self.get_serializer(discount_code)
            logger.info(f"Validation successful for code {code}")
            return Response(serializer.data, status=status.HTTP_200_OK)

        except DiscountCode.DoesNotExist:
            logger.error(f"Discount code {code} does not exist")
            return Response(
                {'error': 'Mã giảm giá không tồn tại'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValueError as e:
            logger.error(f"ValueError converting order_total: {e}")
            return Response(
                {'error': 'Dữ liệu "order_total" không hợp lệ'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return Response(
                {'error': 'Lỗi không xác định, vui lòng thử lại'},
                status=status.HTTP_400_BAD_REQUEST
            )

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    guest_name = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        required=False  # Thêm dòng này để không yêu cầu product từ request data
    )

    class Meta:
        model = Review
        fields = ['id', 'user', 'guest_name', 'product', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']

    def validate(self, data):
        if not self.context['request'].user.is_authenticated and not data.get('guest_name'):
            raise serializers.ValidationError("Guest name is required for unauthenticated users.")
        return data

    def create(self, validated_data):
        guest_name = validated_data.pop('guest_name', None)
        user = self.context['request'].user if self.context['request'].user.is_authenticated else None
        product = validated_data['product']  # product đã được cung cấp từ perform_create
        review = Review.objects.create(
            user=user,
            product=product,
            rating=validated_data['rating'],
            comment=validated_data['comment']
        )
        if guest_name:
            review.comment = f"[Guest: {guest_name}] {review.comment}"
            review.save()
        return review

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Review.objects.filter(product_id=self.kwargs.get('product_pk'))

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(Product, pk=product_id)
        serializer.save(
            user=self.request.user if self.request.user.is_authenticated else None,
            product=product
        )

class UploadImageView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file_obj = request.FILES['image']
        file_name = default_storage.save(f'uploads/{file_obj.name}', file_obj)
        file_url = f"{settings.MEDIA_URL}{file_name}"
        return Response({'url': file_url})

class ProductImageUploadView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        file_obj = request.FILES['image']
        file_name = slugify(os.path.splitext(file_obj.name)[0]) + os.path.splitext(file_obj.name)[1]
        file_path = f'products/{file_name}'
        file_full_path = default_storage.save(file_path, file_obj)
        product.image = file_full_path
        product.save()
        return Response({'status': 'image uploaded', 'image_url': product.image.url})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class ClearCartView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            deleted_count, _ = Cart.objects.filter(user=request.user).delete()
            return Response(
                {'message': f'Successfully cleared {deleted_count} cart items'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
            PasswordResetCode.objects.filter(user=user).delete()
            code = get_random_string(length=32)
            reset_code = PasswordResetCode.objects.create(user=user, code=code)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?code={code}"
            send_mail(
                'Đặt lại mật khẩu',
                f'Nhấp vào liên kết sau để đặt lại mật khẩu của bạn: {reset_url}',
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
        except User.DoesNotExist:
            pass
        return Response({"message": "Nếu tài khoản tồn tại, liên kết đặt lại mật khẩu đã được gửi đến email của bạn."})

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code')
        new_password = request.data.get('new_password')
        if not code or not new_password:
            return Response({"error": "Mã và mật khẩu mới là bắt buộc"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            reset_code = PasswordResetCode.objects.get(code=code, expires_at__gt=timezone.now())
            user = reset_code.user
            user.set_password(new_password)
            user.save()
            reset_code.delete()
            return Response({"message": "Mật khẩu đã được đặt lại thành công."})
        except PasswordResetCode.DoesNotExist:
            return Response({"error": "Mã không hợp lệ hoặc đã hết hạn."}, status=status.HTTP_400_BAD_REQUEST)
        
# views.py
class PublicUserView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk, role='seller')
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'Không tìm thấy người bán'}, status=status.HTTP_404_NOT_FOUND)

