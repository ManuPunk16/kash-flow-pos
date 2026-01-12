import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalTicket } from './modal-ticket';

describe('ModalTicket', () => {
  let component: ModalTicket;
  let fixture: ComponentFixture<ModalTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalTicket]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalTicket);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
