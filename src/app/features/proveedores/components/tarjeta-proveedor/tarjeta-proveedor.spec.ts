import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetaProveedor } from './tarjeta-proveedor';

describe('TarjetaProveedor', () => {
  let component: TarjetaProveedor;
  let fixture: ComponentFixture<TarjetaProveedor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaProveedor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarjetaProveedor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
