
from rest_framework import serializers
from .models import User, Category, Product, Cart, Order, OrderItem, Review
from django.db.models import Avg, Count
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'address']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

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
    price = serializers.FloatField()
    avg_rating = serializers.SerializerMethodField()  # Thêm trường đánh giá trung bình
    sold_count = serializers.SerializerMethodField()  # Thêm trường số lượng bán

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'quantity', 'image', 
                  'category', 'category_id', 'seller', 'created_at', 'updated_at',
                  'avg_rating', 'sold_count']
        read_only_fields = ['seller']

    def get_avg_rating(self, obj):
        # Tính đánh giá trung bình từ reviews
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0

    def get_sold_count(self, obj):
        # Tính tổng số lượng bán từ OrderItem
        return obj.orderitem_set.aggregate(Count('quantity'))['quantity__count'] or 0

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
        return float(obj.total_price)  # Convert to float for consistency

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    total_price = serializers.FloatField()  # Ensure total_price is serialized as a number

    class Meta:
        model = Order
        fields = ['id', 'user', 'total_price', 'status', 'shipping_address', 
                  'created_at', 'updated_at', 'items']
        read_only_fields = ['user', 'total_price', 'created_at', 'updated_at']




class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    guest_name = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )  # New field for guest name

    class Meta:
        model = Review
        fields = ['id', 'user', 'guest_name', 'product', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'product', 'created_at']

    def validate(self, data):
        # Ensure guest_name is provided for unauthenticated users
        request = self.context.get('request')
        if not request.user.is_authenticated and not data.get('guest_name'):
            raise serializers.ValidationError("Guest name is required for unauthenticated users.")
        return data

    def create(self, validated_data):
        guest_name = validated_data.pop('guest_name', None)
        request = self.context.get('request')
        user = request.user if request.user.is_authenticated else None
        review = Review.objects.create(
            user=user,
            product=validated_data['product'],
            rating=validated_data['rating'],
            comment=validated_data['comment']
        )
        if guest_name:
            review.comment = f"[Guest: {guest_name}] {review.comment}"
        review.save()
        return review