import { Routes } from '@angular/router';
import { authGuard } from './auth-guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login-form',
    pathMatch: 'full'
  },
  {
    path: 'login-form',
    loadComponent: () => import('./pages/login-form/login-form.page').then(m => m.LoginFormPage),
  },
  {
    path: 'register-form',
    loadComponent: () => import('./pages/register-form/register-form.page').then(m => m.RegisterFormPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
        canActivate: [authGuard]
      },
      {
        path: 'task-detail',
        loadComponent: () => import('./pages/task-detail/task-detail.page').then(m => m.TaskDetailPage),
        canActivate: [authGuard]
      },
    ]
  }
];
