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
  IonInput, IonModal, IonBadge, IonSegmentButton, IonTextarea, IonSegment } from '@ionic/angular/standalone';
import { TaskService } from 'src/app/services/task.service';
import { RTask } from 'src/app/model/task.model';
import { addIcons } from 'ionicons';
import { trashOutline, filterOutline, closeOutline, createOutline } from 'ionicons/icons';
import { ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
  standalone: true,
  imports: [FormsModule,IonLabel,
    IonBadge,
    IonModal,
    IonInput,
    IonCardContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonItem,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegmentButton,
    IonSegment,
    IonTextarea,
    CommonModule
    
  ],
})
export class TaskDetailPage implements OnInit {
  tasks: RTask[] = [];

  taskModal: RTask | null = null;
  editTaskModal: RTask | null = null;
  editedTaskName = '';
  editedDescription = '';

  filteredTasks: RTask[] = [];
  filterStatus: string = 'all';

  constructor(
    private taskService: TaskService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {
    addIcons({ filterOutline, trashOutline, createOutline, closeOutline });
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
        // this.filterTasks();
      }
    })
  }

  filterTasks(){
    if (this.filterStatus === 'completed') {
      this.tasks = this.filteredTasks.filter(task => task.completed === true);
    } else if (this.filterStatus === 'pending') {
      this.tasks = this.filteredTasks.filter(task => task.completed === false);
    } else {
      this.tasks = [...this.filteredTasks]; 
    }
  }

  startEdit(task: RTask, event: Event) {
    event.stopPropagation();
    
    if (task.completed) return;
    this.editTaskModal = task;
    this.editedTaskName = task.name;
    this.editedDescription  = task.description;
  }

  cancelEdit() {
    this.editTaskModal = null;
  }

  saveEdit() {
    if (!this.editTaskModal || !this.editTaskModal._id) return;

    const updated: RTask = {
      ...this.editTaskModal,
      name: this.editedTaskName,
      description: this.editedDescription,
    };
    this.taskService.updateTask(updated._id!, updated).subscribe({
      next: async (res) => {
        this.taskService.tasksFetch();
        this.cancelEdit();
        console.log(res);
        await this.editToast('Task updated successfully!');
      },
      error: (err) => console.error('ERROR: ', err),
    });
  }

  async deleteTsk(task: RTask, event: Event) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Delete Task!',
      message: 'Are you want to delete?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Deleted Cancelled!');
          },
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            if (!task._id) return;
            this.taskService.deleteTask(task._id).subscribe({
              next: async (data) => {
                this.taskService.tasksFetch();
                console.log(data);
                await this.deleteToast('Task Deleted Successfully!');
                this.taskModal = null
              },
              error: (err) => {
                console.error('ERROR', err);
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  openTaskModal(task: RTask) {
    this.taskModal = task;
  }

  closeTaskModal() {
    this.taskModal = null;
  }

  markAsCompleted() {
    if (!this.taskModal || !this.taskModal._id) return;

    const updated: RTask = {
      ...this.taskModal,
      completed: true,
    };
    this.taskService.updateTask(this.taskModal._id, updated).subscribe({
      next: () => {
        this.fetchTasks();
        this.closeTaskModal();
      },
      error: (err) => console.error('ERROR: ', err),
    });
  }

  async editToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1000,
      position: 'top',
      color,
    });
    await toast.present();
  }

  async deleteToast(message: string, color: string = 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1000,
      position: 'top',
      color,
    });
    await toast.present();
  }
}