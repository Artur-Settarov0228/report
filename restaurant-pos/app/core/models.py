from app.core.database import Base
from app.modules.restaurants.models import Restaurant
from app.modules.users.models import User
from app.modules.categories.models import Category
from app.modules.products.models import Product
from app.modules.tables.models import Table
from app.modules.orders.models import Order, OrderItem
from app.modules.payments.models import Payment

# This file is used to import all models so that Base.metadata can discover them.
