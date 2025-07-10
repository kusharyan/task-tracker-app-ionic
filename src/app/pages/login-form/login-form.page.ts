import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonCard,
  IonCardContent,
  IonContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonInput, IonButton, IonText, IonIcon, IonNote } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailSharp, lockClosed } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.page.html',
  styleUrls: ['./login-form.page.scss'],
  standalone: true,
  imports: [IonNote,  IonButton,  IonIcon, IonText, 
    IonInput,
    IonItem,
    IonCardTitle,
    IonCardHeader,
    IonContent,
    IonCardContent,
    IonCard,
    ReactiveFormsModule,
    CommonModule
  ],
})
export class LoginFormPage implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  errorMessage: string = '';
  private loginSub!: Subscription;

  constructor(private fb: FormBuilder, private router: Router , private auth: AuthService, private toast: ToastController){
    addIcons({mailSharp,lockClosed});
    
    }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['aryan@gmail.com', [Validators.required, Validators.email]],
      password: ['Aryan@12345', [Validators.required, Validators.minLength((6))]]
    })
  }

  async onSubmit(){
    if(this.loginForm.valid){
      const {email, password} = this.loginForm.value;
      this.loginSub = this.auth.login(email, password).subscribe({
        next: async (res)=> {
          this.auth.saveToken(res.token);
          this.router.navigate(['/tabs/home']);
          console.log('User LoggedIn',res);
          await this.showToast('Login Successful!');
        },
        error: async (err)=> {
          this.errorMessage = 'Invalid Login Credentials';
          console.error('ERROR: ', err);
          await this.showToast('Login Failed, Try Again!');
        }
      })
    }
  }

  async showToast(message: string, color: string = 'success'){
    const toast = await this.toast.create({
      message,
      duration: 1000,
      position: 'top',
      color
    });
    await toast.present();
  }

  ngOnDestroy(): void {
    if(this.loginSub){
      this.loginSub.unsubscribe();
    }
  }
}
