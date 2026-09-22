import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './cart-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    dialog[open] {
      animation: slide-in 180ms ease-out;
    }

    @keyframes slide-in {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      dialog[open] { animation: none; }
    }
  `,
})
export class CartDrawer {
  readonly cart = inject(CartService);

  private readonly fb = inject(FormBuilder);

  private readonly drawer =
    viewChild<ElementRef<HTMLDialogElement>>('drawer');

  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
      ],
    ],
    address: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(600),
      ],
    ],
    pincode: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[1-9]\d{5}$/),
      ],
    ],
    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(?:\+?91)?[6-9]\d{9}$/),
      ],
    ],
  });

  constructor() {
    effect(() => {
      const element = this.drawer()?.nativeElement;
      const shouldOpen = this.cart.drawerOpen();

      if (!element) return;

      if (shouldOpen && !element.open) {
        element.showModal();
      } else if (!shouldOpen && element.open) {
        element.close();
      }
    });
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.cart.close();
  }

  checkout(): void {
    this.error.set('');

    const values = this.form.getRawValue();

    this.form.patchValue({
      name: values.name.trim(),
      address: values.address.trim(),
      pincode: values.pincode.trim(),
      phone: values.phone.replace(/[\s()-]/g, ''),
    });

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.error.set(
        'Enter your name, full address, six-digit pincode and valid Indian mobile number.',
      );
      return;
    }

    try {
      const url = this.cart.createWhatsAppUrl(this.form.getRawValue());

      window.location.assign(url);
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to prepare your order. Please try again.',
      );
    }
  }
}