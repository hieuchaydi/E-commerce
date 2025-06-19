from django.db import migrations
from django.utils import timezone
from datetime import timedelta

def create_default_discount_codes(apps, schema_editor):
    DiscountCode = apps.get_model('shop', 'DiscountCode')
    current_time = timezone.datetime(2025, 6, 14, 14, 38, tzinfo=timezone.get_current_timezone())  # 02:38 PM +07

    # Kiểm tra và tạo mã FIRST40 nếu chưa tồn tại
    if not DiscountCode.objects.filter(code='FIRST40').exists():
        DiscountCode.objects.create(
            code='FIRST40',
            discount_amount=40000,
            is_active=True,
            valid_from=current_time,
            valid_until=current_time + timedelta(days=365),
            is_first_order_only=True,
            min_order_value=0,
            max_usage=0
        )

    # Kiểm tra và tạo mã REGULAR20 nếu chưa tồn tại
    if not DiscountCode.objects.filter(code='REGULAR20').exists():
        DiscountCode.objects.create(
            code='REGULAR20',
            discount_amount=20000,
            is_active=True,
            valid_from=current_time,
            valid_until=current_time + timedelta(days=365),
            is_first_order_only=False,
            min_order_value=0,
            max_usage=0
        )

class Migration(migrations.Migration):
    dependencies = [
        ('shop', '0006_discountcode_order_discount_amount_and_more'),
    ]

    operations = [
        migrations.RunPython(create_default_discount_codes),
    ]