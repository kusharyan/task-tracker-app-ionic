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
  IonItem, IonTextarea, IonButton, IonNote, IonIcon, IonBadge, IonText, IonCol, IonRow, IonGrid, IonButtons, IonTabButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TaskService } from 'src/app/services/task.service';
import { AuthService } from 'src/app/services/auth.service';
import { RTask } from 'src/app/model/task.model';
import { addIcons } from 'ionicons';
import { logOutOutline, syncOutline, camera } from 'ionicons/icons';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SqliteService } from 'src/app/services/sqlite.service';
import { Subscription } from 'rxjs';
import { NetworkService } from 'src/app/services/network.service';
import { ToastService } from 'src/app/services/toast.service';

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
    ReactiveFormsModule,
    ScrollingModule
  ],
})
export class HomePage implements OnInit {
  taskForm!: FormGroup;
  tasks: RTask[] = [];
  taskSub!: Subscription;

  constructor(
    private auth: AuthService, 
    private taskService: TaskService, 
    private sqlite: SqliteService,
    private netwrork: NetworkService,
    private router: Router, 
    private fb: FormBuilder,
    private toast: ToastService,) { 
      addIcons({logOutOutline,camera,syncOutline});
  }

  ngOnInit(): void {
    this.taskForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ionViewDidEnter() {
    this.fetchTasks();
    this.taskSub =  this.taskService.taskSubject$.subscribe(()=>{
      this.fetchTasks();
    })
  }

  ionViewDidLeave(){
    if(this.taskSub){
      this.taskSub.unsubscribe();
      console.log("Data Fetching stopped in Tab 1!")
    }
  }

  async fetchTasks(){
    try{
      const res = await this.taskService.loadTasks();
      console.log("Loaded all tasks in home page: ", res);
      this.tasks = res
        .filter(task=> task.createdAt)
        .sort((a, b)=> new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 4);
    } catch(e){
      console.error("ERROR while Fetching tasks: ", e);
    }
  }

  async addTask() {
    if(this.taskForm.valid){
      const {name, description} = this.taskForm.value;
      console.log(this.taskForm.value);

      const newTask: RTask= {
        name,
        description,
        completed: false,
        userId: localStorage.getItem('userId') || '',
        createdAt: new Date().toISOString(),
      }
      
      try {
          const res = await this.taskService.addTasks(newTask);
          this.taskService.tasksFetch();
          await this.toast.showActionToast('add', 'success');
        } catch (err) {
          console.error('ERROR: ', err);
          await this.toast.showActionToast('add', 'error');
        }
      this.taskForm.reset(); 
    }
  }

  logout(){
    this.auth.logout();
    localStorage.removeItem('token')
    this.router.navigate(['/login-form']);
  }

  async performSync(){
    await this.taskService.syncOfflineTasks();
  }
}