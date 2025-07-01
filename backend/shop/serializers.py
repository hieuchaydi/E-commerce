from rest_framework import serializers
from django.db.models import Avg, Count, Sum
from .models import User, Category, Product, Cart, Order, OrderItem, Review, DiscountCode, Message, ReviewImage, ReviewVideo

class UserSerializer(serializers.ModelSerializer):
    seller_rating = serializers.FloatField(read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'address', 'seller_rating']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    seller = UserSerializer(read_only=True)
    avg_rating = serializers.SerializerMethodField()
    sold_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'quantity', 'category', 'category_id', 'image',
            'description', 'seller', 'product_type', 'avg_rating',
            'sold_count', 'created_at', 'updated_at'
        ]

    def get_avg_rating(self, obj):
        try:
            avg = obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
            return round(avg, 2) if avg is not None else 0.0
        except Exception as e:
            print(f"Lỗi khi tính avg_rating: {e}")
            return 0.0

    def get_sold_count(self, obj):
        try:
            return obj.orderitem_set.aggregate(total_sold=Sum('quantity'))['total_sold'] or 0
        except Exception as e:
            print(f"Lỗi khi tính sold_count: {e}")
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
            print(f"Lỗi khi tính total_price: {e}")
            return 0.0

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price']

class DiscountCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCode
        fields = ['id', 'code', 'discount_amount', 'is_active', 'valid_from', 'valid_until', 
                 'is_first_order_only', 'min_order_value', 'max_usage', 'usage_count']
        read_only_fields = ['usage_count']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    total_price = serializers.FloatField()
    discount_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    discount_amount = serializers.FloatField(read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'total_price', 'status', 'shipping_address', 'payment_method', 
                 'created_at', 'updated_at', 'items', 'discount_code', 'discount_amount']
        read_only_fields = ['user', 'total_price', 'created_at', 'updated_at', 'payment_method', 'discount_amount']

    def validate_discount_code(self, value):
        if not value:
            return None
        try:
            discount_code = DiscountCode.objects.get(code=value)
            order_total = self.context.get('order_total', 0)
            user = self.context['request'].user
            if not discount_code.is_valid(user, order_total):
                raise serializers.ValidationError("Mã giảm giá không hợp lệ hoặc đã hết hạn")
            return discount_code
        except DiscountCode.DoesNotExist:
            raise serializers.ValidationError("Mã giảm giá không tồn tại")

    def create(self, validated_data):
        discount_code = validated_data.pop('discount_code', None)
        order = super().create(validated_data)
        if discount_code:
            order.discount_code = discount_code
            order.discount_amount = discount_code.discount_amount
            order.total_price -= discount_code.discount_amount
            order.save()
            discount_code.usage_count += 1
            discount_code.save()
        return order

class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['id', 'image']

class ReviewVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewVideo
        fields = ['id', 'video']
import logging

logger = logging.getLogger(__name__)

class ReviewSerializer(serializers.ModelSerializer):
    images = ReviewImageSerializer(many=True, read_only=True)
    videos = ReviewVideoSerializer(many=True, read_only=True)
    image_files = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False),
        write_only=True, required=False
    )
    video_files = serializers.ListField(
        child=serializers.FileField(max_length=100000000, allow_empty_file=False),
        write_only=True, required=False
    )
    guest_name = serializers.CharField(max_length=255, write_only=True, required=False, allow_null=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'product', 'rating', 'comment', 'guest_name', 'created_at', 'images', 'videos', 'image_files', 'video_files']
        read_only_fields = ['id', 'user', 'created_at', 'images', 'videos']
        extra_kwargs = {
            'product': {'required': False},
            'image_files': {'required': False},
            'video_files': {'required': False},
        }

    def validate_image_files(self, value):
        max_size = 5 * 1024 * 1024
        max_images = 4
        if len(value) > max_images:
            raise serializers.ValidationError(f"Chỉ được phép tải lên tối đa {max_images} hình ảnh.")
        for file in value:
            if file.size > max_size:
                raise serializers.ValidationError(f"Kích thước hình ảnh '{file.name}' vượt quá 5MB")
            if not file.content_type.startswith('image/'):
                raise serializers.ValidationError(f"'{file.name}' không phải là tệp hình ảnh hợp lệ")
        return value

    def validate_video_files(self, value):
        max_size = 50 * 1024 * 1024
        for file in value:
            if file.size > max_size:
                raise serializers.ValidationError(f"Kích thước video '{file.name}' vượt quá 50MB")
            if not file.content_type.startswith('video/'):
                raise serializers.ValidationError(f"'{file.name}' không phải là tệp video hợp lệ")
        return value

    def validate(self, data):
        user = self.context['request'].user
        if not user.is_authenticated and not data.get('guest_name'):
            raise serializers.ValidationError({"guest_name": "Tên khách hàng là bắt buộc khi không đăng nhập."})
        if user.is_authenticated and data.get('guest_name'):
            data.pop('guest_name')
        return data

    def create(self, validated_data):
        image_files = validated_data.pop('image_files', [])
        video_files = validated_data.pop('video_files', [])
        guest_name = validated_data.pop('guest_name', None)
        user = self.context['request'].user if self.context['request'].user.is_authenticated else None
        product = validated_data['product']

        logger.info(f"Tạo đánh giá cho sản phẩm {product.id}, người dùng: {user}, tên khách: {guest_name}")
        logger.info(f"Tệp hình ảnh: {[f.name for f in image_files]}")
        logger.info(f"Tệp video: {[f.name for f in video_files]}")

        try:
            review = Review.objects.create(
                user=user,
                product=product,
                rating=validated_data['rating'],
                comment=validated_data['comment'],
                guest_name=guest_name
            )

            for image_file in image_files:
                logger.info(f"Lưu hình ảnh: {image_file.name}")
                ReviewImage.objects.create(review=review, image=image_file)

            for video_file in video_files:
                logger.info(f"Lưu video: {video_file.name}")
                ReviewVideo.objects.create(review=review, video=video_file)

            if review.images.count() > 4:
                review.delete()
                raise serializers.ValidationError("Một đánh giá không thể có quá 4 hình ảnh.")

            review = Review.objects.prefetch_related('images', 'videos').get(id=review.id)
            return review
        except Exception as e:
            logger.exception(f"Lỗi khi tạo đánh giá: {str(e)}")
            raise

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    receiver_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='receiver')

    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'receiver_id', 'content', 'created_at', 'is_read']
        read_only_fields = ['id', 'sender', 'created_at', 'is_read']

    def create(self, validated_data):
        print(f"Validated data: {validated_data}")
        return Message.objects.create(**validated_data)