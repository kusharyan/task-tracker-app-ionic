import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonIcon, IonButton, IonText, IonInput } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { lockClosed, mailSharp } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/services/toast.service';
@Component({
  selector: 'app-register-form',
  templateUrl: './register-form.page.html',
  styleUrls: ['./register-form.page.scss'],
  standalone: true,
  imports: [IonInput, IonText, IonButton, IonIcon, IonItem, IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonContent,  CommonModule, FormsModule, ReactiveFormsModule]
})
export class RegisterFormPage implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  errorMessage: string = '';
  registerSub!: Subscription;

  constructor(private router: Router, private auth: AuthService, private fb: FormBuilder, private toast: ToastService) {
    addIcons({mailSharp,lockClosed});
   }

  ngOnInit() {
    this.registerForm =  this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength((6))]]
    })
  }

  async onSubmit(){
    if(this.registerForm.valid){
      const {email, password } = this.registerForm.value;
      this.registerSub = this.auth.register(email, password).subscribe({
        next: async (res)=> {
          this.auth.saveToken(res.token);
          // this.router.navigate(['/login-form']);
          console.log(res);
          await this.toast.showActionToast('register', 'success')
        },
        error: async ()=> {
          console.error();
          await this.toast.showActionToast('register', 'error')
        }
      })
    }
  }

  ngOnDestroy(): void {
    if(this.registerSub){
      this.registerSub.unsubscribe();
    }
  }
  
}
