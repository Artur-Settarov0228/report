from enum import Enum

class Unit(str, Enum):
    PIECE = "PIECE"
    KG = "KG"
    GRAM = "GRAM"
    LITER = "LITER"
    ML = "ML"

class TableStatus(str, Enum):
    FREE = "FREE"
    OCCUPIED = "OCCUPIED"

class OrderStatus(str, Enum):
    OPEN = "OPEN"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

class PaymentMethod(str, Enum):
    CASH = "CASH"
    CARD = "CARD"
    CLICK = "CLICK"
    PAYME = "PAYME"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
