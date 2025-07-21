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
import { ToastController, AlertController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Subscription } from 'rxjs';
import { SqliteService } from 'src/app/services/sqlite.service';
import { NetworkService } from 'src/app/services/network.service';

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
    private toastCtrl: ToastController,
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
    console.log(res);
    this.filteredTasks = res;
    this.tasks = [...this.filteredTasks];
    this.filterTasks();
    // this.taskService.loadTasks().subscribe({
    //   next: (data) => {
    //     console.log(data);
    //     this.filteredTasks = data;
    //     this.tasks = [...this.filteredTasks];
    //     this.filterTasks();
    //   }
    // })
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

    const isOnline = this.network.isOnline;

    if(isOnline){
      const res = await this.taskService.updateTask(updated._id!, updated);
      this.taskService.tasksFetch();
      this.cancelEdit();
      console.log(res);
      await this.editToast("Task updated successfully!")
    } else{
      await this.sqlite.updateLocalTask({
        ...updated,
        synced: 0
      });
      this.taskService.tasksFetch();
      // await this.fetchTasks();
      await this.editToast('Task updated successfully, will sync later!');  
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
            
            const isOnline = this.network.isOnline;

            if(isOnline){
              try{
                const res = await this.taskService.deleteTask(task._id);
                this.taskService.tasksFetch();
                await this.deleteToast("Task Deleted Successfully!");
                this.taskModal = null;
              } catch(err){
                console.error("ERROR: ", err);
              }
            } else {
              await this.sqlite.deleteLocalTask(task._id!);
              this.taskService.tasksFetch();
              await this.deleteToast('Task deleted locally. Will sync later.');
              this.taskModal = null;
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

    const isOnline = this.network.isOnline;

    if(isOnline){
      try{
        const res = await this.taskService.updateTask(this.taskModal._id, updated);
        console.log(res);
        this.taskService.tasksFetch();
        this.closeTaskModal();
      } catch(e){
        console.error("ERROR: ", e)
      }
    } else{
      await this.sqlite.updateLocalTask({ ...updated, synced: 0 });
      this.closeTaskModal();
    }
    // this.taskService.updateTask(this.taskModal._id, updated).subscribe({
    //   next: async () => {
    //     // await this.sqlite.updateLocalTask(updated);

    //     this.fetchTasks();
    //     this.closeTaskModal();
    //   },
    //   error: (err) => console.error('ERROR: ', err),
    // });
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
  
  async takePhoto() {
    const image = await Camera.getPhoto({
      quality : 90,
      allowEditing : true,
      resultType : CameraResultType.DataUrl,
      source : CameraSource.Camera,
      saveToGallery: true
    })
    this.capturedImage = image.webPath;
  }
}