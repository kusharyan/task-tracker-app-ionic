import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toast: ToastController) {}

  async showToast(
    message: string,
    color: string
  ) {
    const toast = await this.toast.create({
      message,
      color,
      duration: 2000,
      position: 'top',
    });
    toast.present();
  }

  async showActionToast(
    action: 'login' | 'register' | 'add' | 'edit' | 'delete' | 'complete',
    status: 'success' | 'error' = 'success'
  ) {
    let message = '';
    let color: string = 'primary';

    if (status === 'error') {
      switch (action) {
        case 'login':
          message = 'Login failed. Please check your credentials.';
          color = 'danger';
          break;
        case 'register':
          message = 'Registration failed. Try again later.';
          color = 'danger';
          break;
        case 'add':
          message = 'Failed to add task.';
          color = 'danger';
          break;
        case 'edit':
          message = 'Failed to edit task.';
          color = 'danger';
          break;
        case 'delete':
          message = 'Failed to delete task.';
          color = 'danger';
          break;
        case 'complete':
          message = 'Failed to mark as completed.';
          color = 'danger';
          break;
      }
    } else {
      switch (action) {
        case 'login':
          message = 'Login successful!';
          color = 'primary';
          break;
        case 'register':
          message = 'Registration successful!';
          color = 'success';
          break;
        case 'add':
          message = 'Task added successfully!';
          color = 'success';
          break;
        case 'edit':
          message = 'Task edited successfully!';
          color = 'success';
          break;
        case 'delete':
          message = 'Task deleted!';
          color = 'warning';
          break;
        case 'complete':
          message = 'Task marked as completed!';
          color = 'success';
          break;
      }
    }

    await this.showToast(message, color);
  }
}
