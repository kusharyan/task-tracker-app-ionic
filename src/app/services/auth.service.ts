import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://10.46.22.66:3000/api';

  constructor(private http: HttpClient, private router: Router) { }

  login(email: string, password: string){
    return this.http.post<{token: String}>(`${this.apiUrl}/login`, {email, password})
  }

  register(email: string, password: string){
    return this.http.post<{token: string}>(`${this.apiUrl}/register`, {email, password})
  }

  saveToken(token: any){
    return localStorage.setItem('token', token )
  }

  getToken(){
    return localStorage.getItem('token')
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login-form']);
  }

  isLoggedIn(){
    return !!localStorage.getItem('token');
  }
}
