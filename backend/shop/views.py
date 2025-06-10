import os
from django.db.models import Avg, Count
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from config import settings
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
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
    UserSerializer, CategorySerializer, ProductSerializer,
    CartSerializer, OrderSerializer, ReviewSerializer
)
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Cart
from .serializers import CartSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Cart
from django.db.models import Sum, Count
User = get_user_model()

from django.utils.text import slugify
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
        request.user.auth_token.delete()
        return Response(status=status.HTTP_200_OK)


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


class AdminStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # Tính revenue từ tổng giá của các đơn hàng đã hoàn thành
        revenue = Order.objects.filter(status='completed').aggregate(
            total_revenue=Sum('total_price')
        )['total_revenue'] or 0

        stats = {
            'totalUsers': User.objects.count(),
            'totalProducts': Product.objects.count(),
            'totalOrders': Order.objects.count(),
            'revenue': float(revenue),  # Thêm revenue và chuyển sang float
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


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    # Thêm các filter backend
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    # Các trường hỗ trợ lọc
    filterset_fields = {
        'category': ['exact'],
        'price': ['gte', 'lte'],  # Lọc giá lớn hơn hoặc bằng, nhỏ hơn hoặc bằng
    }
    # Các trường hỗ trợ tìm kiếm
    search_fields = ['name', 'description']
    # Các trường hỗ trợ sắp xếp
    ordering_fields = ['price', 'created_at', 'sold_count']
    # Sắp xếp mặc định
    ordering = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        # Lọc theo danh mục (đã có trong mã của bạn)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)

        # Lọc theo khoảng giá
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Lọc theo đánh giá trung bình
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.annotate(avg_rating=Avg('reviews__rating')).filter(avg_rating__gte=min_rating)

        # Sắp xếp theo số lượng bán
        if 'sold_count' in self.request.query_params.get('ordering', ''):
            queryset = queryset.annotate(sold_count=Count('orderitem')).order_by('sold_count')

        return queryset


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

        # Kiểm tra sản phẩm có tồn tại không
        try:
            Product.objects.get(id=product.id)
        except Product.DoesNotExist:
            return Response({'error': 'Sản phẩm không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

        # (Tùy chọn) Kiểm tra số lượng tồn kho nếu Product có trường 'stock'
        # if product.stock < quantity:
        #     return Response({'error': 'Không đủ hàng trong kho'}, status=status.HTTP_400_BAD_REQUEST)

        cart_item, created = Cart.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            new_quantity = cart_item.quantity + quantity
            # (Tùy chọn) Kiểm tra tồn kho khi tăng số lượng
            # if product.stock < new_quantity:
            #     return Response({'error': 'Không đủ hàng trong kho'}, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = new_quantity
            cart_item.save()

        output_serializer = self.get_serializer(cart_item)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_quantity(self, request, pk=None):
        """Cập nhật số lượng của một sản phẩm trong giỏ hàng"""
        cart_item = self.get_object()
        quantity = request.data.get('quantity')

        if quantity is None:
            return Response({'error': 'Vui lòng cung cấp số lượng'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            quantity = int(quantity)
            if quantity < 1:
                raise ValueError
        except ValueError:
            return Response({'error': 'Số lượng không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

        # (Tùy chọn) Kiểm tra tồn kho
        # if cart_item.product.stock < quantity:
        #     return Response({'error': 'Không đủ hàng trong kho'}, status=status.HTTP_400_BAD_REQUEST)

        cart_item.quantity = quantity
        cart_item.save()
        serializer = self.get_serializer(cart_item)
        return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        cart_items = Cart.objects.filter(user=request.user)
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        total_price = sum(item.total_price for item in cart_items)
        order = Order.objects.create(
            user=request.user,
            total_price=total_price,
            shipping_address=request.data.get('shipping_address', '')
        )

        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )

        cart_items.delete()
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put'])
    def status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status
        order.save()
        return Response({'status': order.status})


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.kwargs.get('product_pk')
        if product_id:
            return Review.objects.filter(product_id=product_id)
        return Review.objects.all()

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(Product, pk=product_id)
        serializer.save(user=self.request.user, product=product)


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
        # Sanitize file name
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
        Cart.objects.filter(user=request.user).delete()
        return Response({'message': 'Cart cleared'}, status=status.HTTP_200_OK)   

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Xóa token hiện tại
            request.user.auth_token.delete()
            # Tạo response
            response = Response(status=status.HTTP_200_OK)
            # Xóa cookie session nếu có
            if hasattr(request, 'session'):
                request.session.flush()
            return response
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]  # Allow anyone to create reviews

    def get_queryset(self):
        return Review.objects.filter(
            product_id=self.kwargs.get('product_pk')
        )

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(Product, pk=product_id)
        serializer.save(
            user=self.request.user if self.request.user.is_authenticated else None,
            product=product
        )