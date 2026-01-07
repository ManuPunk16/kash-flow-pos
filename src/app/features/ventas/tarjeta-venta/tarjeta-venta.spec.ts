import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetaVenta } from './tarjeta-venta';

describe('TarjetaVenta', () => {
  let component: TarjetaVenta;
  let fixture: ComponentFixture<TarjetaVenta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaVenta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarjetaVenta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
