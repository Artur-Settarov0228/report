from sqladmin import ModelView
from app.modules.restaurants.models import Restaurant
from app.modules.users.models import User
from app.modules.categories.models import Category
from app.modules.products.models import Product
from app.modules.tables.models import Table
from app.modules.orders.models import Order, OrderItem
from app.modules.payments.models import Payment

class RestaurantAdmin(ModelView, model=Restaurant):
    column_list = [Restaurant.id, Restaurant.name, Restaurant.address, Restaurant.phone, Restaurant.is_active]
    form_columns = ["name", "address", "phone", "is_active"]
    icon = "fa-solid fa-store"

class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.username, User.full_name, User.restaurant, User.is_active]
    column_searchable_list = [User.username, User.full_name]
    form_columns = ["username", "full_name", "password_hash", "restaurant", "is_active"]
    icon = "fa-solid fa-user"

class CategoryAdmin(ModelView, model=Category):
    column_list = [Category.id, Category.name, Category.restaurant, Category.is_active]
    column_searchable_list = [Category.name]
    form_columns = ["name", "description", "restaurant", "is_active"]
    icon = "fa-solid fa-list"

class ProductAdmin(ModelView, model=Product):
    column_list = [Product.id, Product.name, Product.sku, Product.price, Product.unit, Product.category, Product.is_active]
    column_searchable_list = [Product.name, Product.sku]
    form_columns = ["name", "description", "sku", "price", "unit", "image_url", "category", "restaurant", "is_active"]
    icon = "fa-solid fa-burger"

class TableAdmin(ModelView, model=Table):
    column_list = [Table.id, Table.table_number, Table.seats, Table.restaurant, Table.is_active]
    form_columns = ["table_number", "seats", "restaurant", "is_active"]
    icon = "fa-solid fa-chair"

class OrderAdmin(ModelView, model=Order):
    column_list = [Order.id, Order.table, Order.cashier, Order.status, Order.total_amount, Order.created_at]
    form_columns = ["table", "cashier", "status", "total_amount"]
    icon = "fa-solid fa-receipt"

class OrderItemAdmin(ModelView, model=OrderItem):
    column_list = [OrderItem.id, OrderItem.order, OrderItem.product_name, OrderItem.quantity, OrderItem.unit_price, OrderItem.subtotal]
    form_columns = ["order", "product", "product_name", "quantity", "unit_price", "subtotal"]
    icon = "fa-solid fa-cart-shopping"

class PaymentAdmin(ModelView, model=Payment):
    column_list = [Payment.id, Payment.order, Payment.amount, Payment.method, Payment.status, Payment.created_at]
    form_columns = ["order", "amount", "method", "status"]
    icon = "fa-solid fa-money-bill"

def setup_admin(admin):
    admin.add_view(RestaurantAdmin)
    admin.add_view(UserAdmin)
    admin.add_view(CategoryAdmin)
    admin.add_view(ProductAdmin)
    admin.add_view(TableAdmin)
    admin.add_view(OrderAdmin)
    admin.add_view(OrderItemAdmin)
    admin.add_view(PaymentAdmin)

