import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import {
  Product,
  ProductWeight,
} from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './product-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  private readonly cart = inject(CartService);

  readonly product = input.required<Product>();
  readonly selectedWeight = signal<ProductWeight>(200);
  readonly feedback = signal('');

  readonly selectedVariant = computed(() => {
    const variants = this.product().variants;

    const selected =
      variants.find(item => item.weight === this.selectedWeight()) ??
      variants[0];

    if (!selected) {
      throw new Error('A product must have at least one size.');
    }

    return selected;
  });

  selectWeight(weight: ProductWeight): void {
    this.selectedWeight.set(weight);
    this.feedback.set('');
  }

  addToCart(): void {
    const variant = this.selectedVariant();

    this.cart.add(this.product(), variant.weight);

    this.feedback.set(
      `${variant.weight}g added. Basket: ${this.cart.totalQuantity()} items.`,
    );
  }
  buyViaWhatsApp(): void {
  this.addToCart();
  this.cart.open();
}
}
