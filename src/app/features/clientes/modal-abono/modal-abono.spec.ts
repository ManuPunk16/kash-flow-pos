import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAbono } from './modal-abono';

describe('ModalAbono', () => {
  let component: ModalAbono;
  let fixture: ComponentFixture<ModalAbono>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAbono]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAbono);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
