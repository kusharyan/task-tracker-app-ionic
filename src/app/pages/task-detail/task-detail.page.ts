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
import { trashOutline, filterOutline, closeOutline, createOutline, camera, listOutline, checkmarkDoneOutline, timeOutline, searchOutline } from 'ionicons/icons';
import { AlertController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Subscription } from 'rxjs';
import { SqliteService } from 'src/app/services/sqlite.service';
import { NetworkService } from 'src/app/services/network.service';
import { ToastService } from 'src/app/services/toast.service';

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
    IonTextarea,
    CommonModule,
    IonSegment, IonSegmentButton
    
  ],
})
export class TaskDetailPage  {
  tasks: RTask[] = [];
  taskSub!: Subscription;

  taskModal: RTask | null = null;
  editTaskModal: RTask | null = null;
  editedTaskName = '';
  editedDescription = '';

  filteredTasks: RTask[] = [];
  filterStatus: string = 'all';

  capturedImage : string | undefined;

  constructor(
    private taskService: TaskService,
    private sqlite: SqliteService,
    private network: NetworkService,
    private toast: ToastService,
    private alertCtrl: AlertController,
  ) {
    addIcons({searchOutline,listOutline,checkmarkDoneOutline,timeOutline,closeOutline,camera,trashOutline,createOutline,filterOutline});
  }

  ionViewDidEnter() {
    this.fetchTasks();
    this.taskSub = this.taskService.taskSubject$.subscribe(() => {
      this.fetchTasks();
    });
  }

  ionViewDidLeave(){
    if(this.taskSub){
      this.taskSub.unsubscribe();
      console.log("Data fetching stopped in Tab 2!");
    }
  }

  async fetchTasks() {
    const res = await this.taskService.loadTasks();
    console.log("Loaded all tasks in tasks page: ", res);
    
    const sorted = res
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    this.filteredTasks = sorted;
    this.tasks = [...this.filteredTasks];
    this.filterTasks();
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

  async saveEdit() {
    if (!this.editTaskModal || !this.editTaskModal._id) return;

    const updated: RTask = {
      ...this.editTaskModal,
      name: this.editedTaskName,
      description: this.editedDescription,
    };

    try {
      await this.taskService.updateTask(updated._id!, updated);
      this.taskService.tasksFetch();
      this.cancelEdit();
      
      await this.toast.showActionToast('edit', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      await this.toast.showActionToast('edit', 'error');
    }
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
          handler: async () => {
            if (!task._id) return;

            try {
              const res = await this.taskService.deleteTask(task._id);
              this.taskService.tasksFetch();
              await this.toast.showActionToast('delete', 'success');
              this.taskModal = null;
            } catch (err) {
              console.error('ERROR: ', err);
              await this.toast.showActionToast('delete', 'error');
            }
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

  async markAsCompleted() {
    if (!this.taskModal || !this.taskModal._id) return;

    const updated: RTask = {
      ...this.taskModal,
      completed: true,
    };
  
    try {
      await this.taskService.updateTask(this.taskModal._id, updated);
      this.taskService.tasksFetch();
      this.closeTaskModal();
      
      await this.toast.showActionToast('complete', 'success');
    } catch (e) {
      console.error("Error marking task as completed: ", e);
      await this.toast.showActionToast('complete', 'error');
    }
  }
  
  async takePhoto() {
    const image = await Camera.getPhoto({
      quality : 90,
      allowEditing : true,
      resultType : CameraResultType.DataUrl,
      source : CameraSource.Camera,
      saveToGallery: true
    })
    this.capturedImage = image.dataUrl;
  }
}