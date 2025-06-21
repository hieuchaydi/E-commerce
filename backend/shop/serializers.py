from rest_framework import serializers
from .models import User, Category, Product, Cart, Order, OrderItem, Review, DiscountCode
from django.db.models import Avg, Count, Sum

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
    seller = UserSerializer(read_only=True)
    avg_rating = serializers.SerializerMethodField()
    sold_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'quantity', 'category', 'image',
            'description', 'seller', 'product_type', 'avg_rating',
            'sold_count', 'created_at', 'updated_at'
        ]
    
    def get_avg_rating(self, obj):
        try:
            avg = obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
            return round(avg, 2) if avg is not None else 0.0
        except Exception as e:
            print(f"Error in get_avg_rating: {e}")
            return 0.0

    def get_sold_count(self, obj):
        try:
            return obj.orderitem_set.aggregate(total_sold=Sum('quantity'))['total_sold'] or 0
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

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    guest_name = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        required=False
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
        product = validated_data['product']
        review = Review.objects.create(
            user=user,
            product=product,
            rating=validated_data['rating'],
            comment=validated_data['comment']
        )
        if guest_name:
            review.guest_name = guest_name
            review.save()
        return review


