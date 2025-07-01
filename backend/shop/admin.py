from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Category, Product, Cart, Order, OrderItem, Review, DiscountCode, Message, PasswordResetCode, ReviewImage, ReviewVideo

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'seller_rating')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'phone')
    fieldsets = UserAdmin.fieldsets + (
        ('Thông tin bổ sung', {'fields': ('role', 'phone', 'address', 'seller_rating')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Thông tin bổ sung', {'fields': ('role', 'phone', 'address')}),
    )
    readonly_fields = ('seller_rating',)

class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'quantity', 'category', 'seller', 'product_type', 'created_at')
    list_filter = ('category', 'product_type', 'seller')
    search_fields = ('name', 'description', 'seller__username')
    date_hierarchy = 'created_at'
    list_editable = ('price', 'quantity')
    readonly_fields = ('created_at', 'updated_at')

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'quantity', 'total_price', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'product__name')
    readonly_fields = ('total_price', 'created_at')

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('price',)

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_price', 'status', 'discount_amount', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'id')
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline]
    readonly_fields = ('created_at', 'updated_at', 'discount_amount')

class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 0
    readonly_fields = ('uploaded_at',)

class ReviewVideoInline(admin.TabularInline):
    model = ReviewVideo
    extra = 0
    readonly_fields = ('uploaded_at',)

class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'guest_name', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__name', 'user__username', 'guest_name', 'comment')
    date_hierarchy = 'created_at'
    inlines = [ReviewImageInline, ReviewVideoInline]
    readonly_fields = ('created_at',)

class DiscountCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_amount', 'is_active', 'valid_from', 'valid_until', 'usage_count')
    list_filter = ('is_active', 'valid_from', 'valid_until')
    search_fields = ('code',)
    readonly_fields = ('usage_count',)

class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'content', 'created_at', 'is_read')
    list_filter = ('is_read', 'created_at')
    search_fields = ('sender__username', 'receiver__username', 'content')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at',)

class PasswordResetCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'created_at', 'expires_at')
    search_fields = ('user__username', 'code')
    readonly_fields = ('created_at', 'expires_at')

# Đăng ký các model với Django Admin
admin.site.register(User, CustomUserAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(Cart, CartAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem)
admin.site.register(Review, ReviewAdmin)
admin.site.register(DiscountCode, DiscountCodeAdmin)
admin.site.register(Message, MessageAdmin)
admin.site.register(PasswordResetCode, PasswordResetCodeAdmin)
admin.site.register(ReviewImage)
admin.site.register(ReviewVideo)