import {
  computed,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CustomerDetails } from '../models/customer.model';
import {
  CartItem,
  Product,
  ProductWeight,
} from '../models/product.model';
import { isPlatformBrowser } from '@angular/common';
import { PRODUCTS } from '../data/products';
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly cartItems = signal<readonly CartItem[]>([]);

  readonly items = this.cartItems.asReadonly();

  readonly totalQuantity = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0),
  );

  readonly subtotalPaise = computed(() =>
    this.items().reduce(
      (total, item) => total + item.unitPricePaise * item.quantity,
      0,
    ),
  );

  add(product: Product, weight: ProductWeight): void {
    const variant = product.variants.find(item => item.weight === weight);

    if (!variant) {
      return;
    }

    const key = `${product.id}:${weight}`;

    this.cartItems.update(items => {
      const existing = items.find(item => item.key === key);

      if (existing) {
        return items.map(item =>
          item.key === key
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...items,
        {
          key,
          product,
          weight,
          unitPricePaise: variant.pricePaise,
          quantity: 1,
        },
      ];
    });
  }

  setQuantity(key: string, quantity: number): void {
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      return;
    }

    if (quantity === 0) {
      this.remove(key);
      return;
    }

    this.cartItems.update(items =>
      items.map(item =>
        item.key === key ? { ...item, quantity } : item,
      ),
    );
  }

  remove(key: string): void {
    this.cartItems.update(items =>
      items.filter(item => item.key !== key),
    );
  }

  clear(): void {
    this.cartItems.set([]);
  }
  readonly drawerOpen = signal(false);

open(): void {
  this.drawerOpen.set(true);
}

close(): void {
  this.drawerOpen.set(false);
}
// Replace this with your business WhatsApp number.
// Use country code + number, without "+" or spaces.
private readonly whatsappNumber = '918590073463';

createWhatsAppUrl(customer: CustomerDetails): string {
  if (!/^[1-9]\d{7,14}$/.test(this.whatsappNumber)) {
    throw new Error(
      'Please configure your business WhatsApp number in CartService.',
    );
  }

  if (this.items().length === 0) {
    throw new Error('Please add a pickle to your basket first.');
  }

  const name = customer.name.trim();
  const address = customer.address.trim();
  const pincode = customer.pincode.trim();
  const phone = customer.phone.replace(/[\s()-]/g, '');

  if (
    name.length < 2 ||
    address.length < 10 ||
    !/^[1-9]\d{5}$/.test(pincode) ||
    !/^(?:\+?91)?[6-9]\d{9}$/.test(phone)
  ) {
    throw new Error('Please check your delivery details.');
  }

  const formatPrice = (paise: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(paise / 100);

  const orderLines = this.items().map((item, index) => {
    const weight = item.weight === 1000 ? '1kg' : `${item.weight}g`;
    const lineTotal = item.unitPricePaise * item.quantity;

    return (
      `${index + 1}. ${item.product.name} — ${weight}\n` +
      `Quantity: ${item.quantity} × ${formatPrice(item.unitPricePaise)}\n` +
      `Line total: ${formatPrice(lineTotal)}`
    );
  });

  const message = [
    '*New order — Ruchi Yoram*',
    '',
    '*Customer details*',
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Address: ${address}`,
    `Pincode: ${pincode}`,
    '',
    '*My basket*',
    orderLines.join('\n\n'),
    '',
    `*Items total: ${formatPrice(this.subtotalPaise())}*`,
    'Payment method: UPI',
    'Delivery charges: please confirm for my pincode.',
    '',
    'Please confirm availability, final amount to pay via UPI,',
    'and your UPI payment details.',
  ].join('\n');

  return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
private readonly storageKey = 'ruchi-yoram-cart-v1';

private readonly isBrowser = isPlatformBrowser(
  inject(PLATFORM_ID),
);

constructor() {
  if (!this.isBrowser) {
    return;
  }

  this.cartItems.set(this.loadSavedCart());

  effect(() => {
    // Save only product references and quantities.
    // Prices will come from the current catalog when restored.
    const savedItems = this.items().map(item => ({
      productId: item.product.id,
      weight: item.weight,
      quantity: item.quantity,
    }));

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(savedItems),
      );
    } catch {
      // The cart still works if browser storage is unavailable.
    }
  });
}

private loadSavedCart(): readonly CartItem[] {
  try {
    const saved = localStorage.getItem(this.storageKey);

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const restored = new Map<string, CartItem>();

    for (const entry of parsed) {
      if (
        typeof entry !== 'object' ||
        entry === null ||
        !('productId' in entry) ||
        !('weight' in entry) ||
        !('quantity' in entry)
      ) {
        continue;
      }

      const { productId, weight, quantity } = entry;

      if (
        typeof productId !== 'string' ||
        typeof weight !== 'number' ||
        typeof quantity !== 'number' ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      ) {
        continue;
      }

      const product = PRODUCTS.find(
        item => item.id === productId,
      );

      const variant = product?.variants.find(
        item => item.weight === weight,
      );

      if (!product || !variant) {
        continue;
      }

      const key = `${product.id}:${variant.weight}`;

      restored.set(key, {
        key,
        product,
        weight: variant.weight,
        unitPricePaise: variant.pricePaise,
        quantity,
      });
    }

    return [...restored.values()];
  } catch {
    // Ignore damaged or unreadable saved data.
    return [];
  }
}
}