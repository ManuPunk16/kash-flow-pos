import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleVenta } from './detalle-venta';

describe('DetalleVenta', () => {
  let component: DetalleVenta;
  let fixture: ComponentFixture<DetalleVenta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleVenta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleVenta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
