import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonItem, IonLabel, IonTextarea, IonButton, IonNote, IonIcon, IonBadge, IonText, IonCol, IonRow, IonGrid } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TaskService } from 'src/app/services/task.service';
import { AuthService } from 'src/app/services/auth.service';
import { RTask } from 'src/app/model/task.model';
import { addIcons } from 'ionicons';
import { logOutOutline, syncOutline } from 'ionicons/icons';
import { ToastController} from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonGrid, IonRow, IonCol, IonText, IonBadge, IonIcon, IonNote, IonButton, IonTextarea, IonHeader, IonTitle, IonToolbar,
    IonItem,
    IonInput,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonContent, 
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
})
export class HomePage implements OnInit {
  taskForm!: FormGroup;
  tasks: RTask[] = [];

  constructor(
    private auth: AuthService, 
    private taskService: TaskService, 
    private router: Router, 
    private fb: FormBuilder,
    private toast: ToastController) { 
      addIcons({logOutOutline,syncOutline});
    }

  ngOnInit() {
    this.taskForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });

    this.fetchTasks();
    this.taskService.taskSubject$.subscribe(()=>{
      this.fetchTasks();
    })
  }

  fetchTasks(){
    this.taskService.loadTasks().subscribe({
      next: (data)=> {
        console.log(data);
        this.tasks = data
          .filter(task=> task.createdAt)
          .sort((a, b)=> new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, 4);
      },
      error: (err)=> console.error('ERROR: ', err)
    })
  }

  async addTask() {
    if(this.taskForm.valid){
      const {name, description} = this.taskForm.value;
      console.log(this.taskForm.value);  
      this.taskService.addTasks({...this.taskForm.value, completed: false}).subscribe({
        next: async (data)=> {
          console.log('Task Added: ', data);
          this.taskService.tasksFetch();
          await this.showToast('Task Created Successfully!')
        },
        error: (err)=> console.log('ERROR: ', err)
      })
      this.taskForm.reset(); 
    }
  }

  logout(){
    this.auth.logout();
    localStorage.removeItem('token')
    this.router.navigate(['/login-form']);
  }

  async showToast(message: string, color: string = 'secondary'){
    const toast = await this.toast.create({
      message,
      duration: 1000,
      position: 'top',
      color
    })
    await toast.present();
  }
}

