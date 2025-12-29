import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetaCliente } from './tarjeta-cliente';

describe('TarjetaCliente', () => {
  let component: TarjetaCliente;
  let fixture: ComponentFixture<TarjetaCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarjetaCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
