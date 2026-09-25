// types/invoice.ts
// ==================== INVOICE EMAIL TYPES ====================

export interface InvoiceItem {
  name: string;
  image?: string;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  subtotal: number;
}

export interface InvoiceAddress {
  type?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
}

export interface InvoiceOrder {
  orderNumber: string;
  items: InvoiceItem[];
  shippingAddress: InvoiceAddress;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  createdAt: Date | string;
}

export interface InvoiceRecipient {
  name: string;
  email: string;
}
