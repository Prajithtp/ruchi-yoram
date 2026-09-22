import { CurrencyPipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CartDrawer } from './components/cart-drawer/cart-drawer';
import { ProductCard } from './components/product-card/product-card';
import { PRODUCTS } from './data/products';
import { CartService } from './services/cart.service';

type ProductFilter = 'all' | 'vegetarian' | 'non-vegetarian';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductCard, CartDrawer, CurrencyPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly cart = inject(CartService);
  // Individual pickles shown in the regular catalog.
readonly products = PRODUCTS.filter(product => !product.isCombo);

// Offer shown in its own section.
readonly combo = PRODUCTS.find(
  product => product.id === 'sardine-chicken-combo',
);

  readonly activeFilter = signal<ProductFilter>('all');

  readonly filters: readonly {
    value: ProductFilter;
    label: string;
  }[] = [
    { value: 'all', label: 'All pickles' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'non-vegetarian', label: 'Non-vegetarian' },
  ];

  readonly filteredProducts = computed(() => {
    const filter = this.activeFilter();

    return this.products.filter(product => {
      if (filter === 'vegetarian') {
        return product.vegetarian;
      }

      if (filter === 'non-vegetarian') {
        return !product.vegetarian;
      }

      return true;
    });
  });
  addCombo(): void {
  const offer = this.combo;

  if (!offer) {
    return;
  }

  this.cart.add(offer, 400);
  this.cart.open();
}
}