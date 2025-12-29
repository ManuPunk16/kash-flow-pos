import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCliente } from './modal-cliente';

describe('ModalCliente', () => {
  let component: ModalCliente;
  let fixture: ComponentFixture<ModalCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
