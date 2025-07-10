import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterFormPage } from './register-form.page';

describe('RegisterFormPage', () => {
  let component: RegisterFormPage;
  let fixture: ComponentFixture<RegisterFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
