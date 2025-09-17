import { ComponentFixture, TestBed } from '@angular/core/testing';

import { P404 } from './p404';

describe('P404', () => {
  let component: P404;
  let fixture: ComponentFixture<P404>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [P404]
    })
    .compileComponents();

    fixture = TestBed.createComponent(P404);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
