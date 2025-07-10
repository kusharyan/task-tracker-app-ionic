import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonCard,
  IonIcon,
  IonButton,
  IonButtons,
  IonCardContent,
  IonInput, IonModal } from '@ionic/angular/standalone';
import { TaskService } from 'src/app/services/task.service';
import { RTask } from 'src/app/model/task.model';
import { addIcons } from 'ionicons';
import { trashOutline, filterOutline, searchOutline, closeOutline, createOutline } from 'ionicons/icons';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
  standalone: true,
  imports: [IonModal, 
    IonInput,
    IonCardContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonLabel,
    IonItem,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    CommonModule,
    FormsModule,
  ],
})
export class TaskDetailPage implements OnInit {
  tasks: RTask[] = [];

  currentEditingTask: RTask | null = null;
  editedTaskName = '';
  editedDescription = '';

  constructor(private taskService: TaskService) {
    addIcons({searchOutline,filterOutline,trashOutline,createOutline,closeOutline});
  }

  ngOnInit() {
    this.fetchTasks();
    this.taskService.taskSubject$.subscribe(() => {
      this.fetchTasks();
    });
  }

  fetchTasks() {
    this.taskService.loadTasks().subscribe({
      next: (data) => {
        console.log(data);
        this.tasks = data;
      },
    });
  }

  startEdit(task: RTask) {
    if (task.completed) return;
    this.currentEditingTask = task;
    this.editedTaskName = task.name;
    this.editedDescription = task.description;
  }

  cancelEdit() {
    this.currentEditingTask = null;
  }

  saveEdit() { 
    if(!this.currentEditingTask || !this.currentEditingTask._id) return;

    const updated: RTask = {
      ...this.currentEditingTask,
      name: this.editedTaskName,
      description: this.editedDescription
    };
    this.taskService.updateTask(updated._id!, updated).subscribe({
      next: (res)=>{
        this.taskService.tasksFetch();
        this.cancelEdit();
        console.log(res);
      },
      error: (err)=> console.error('ERROR: ', err)
    })
  }

  deleteTsk(task: RTask) {
    if (!task._id) return;
    this.taskService.deleteTask(task._id).subscribe({
      next: (data) => {
        this.taskService.tasksFetch();  
        console.log(data);
      },
      error: (err) => {
        console.error('ERROR', err);
      },
    });
  }

}
