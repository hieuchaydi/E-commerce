
from sympy import Sum
from rest_framework import serializers
from .models import User, Category, Product, Cart, Order, OrderItem, Review
from django.db.models import Avg, Count, Sum

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

from rest_framework import serializers
from .models import Product, Category


class ProductSerializer(serializers.ModelSerializer):
    price = serializers.FloatField()  # Không cần source='price'
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
        return float(obj.total_price)  # Convert to float for consistency

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    total_price = serializers.FloatField()
    payment_method = serializers.CharField(read_only=True)  # Make read-only

    class Meta:
        model = Order
        fields = ['id', 'user', 'total_price', 'status', 'shipping_address', 'payment_method', 'created_at', 'updated_at', 'items']
        read_only_fields = ['user', 'total_price', 'created_at', 'updated_at', 'payment_method']



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