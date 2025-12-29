import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalProveedor } from './modal-proveedor';

describe('ModalProveedor', () => {
  let component: ModalProveedor;
  let fixture: ComponentFixture<ModalProveedor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalProveedor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalProveedor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
