import { Injectable } from '@angular/core';
import { RTask, Task } from '../model/task.model';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/api/tasks';
  private taskSubject = new Subject<void>();
  taskSubject$ = this.taskSubject.asObservable();

  tasksFetch(){
    this.taskSubject.next();
  }
  
  constructor(private http: HttpClient) { }

  loadTasks(): Observable<RTask[]>{
    return this.http.get<RTask[]>(this.apiUrl);
  }

  addTasks(task: Task): Observable<RTask>{
    return this.http.post<RTask>(this.apiUrl, task);
  }

  updateTask(_id: string, task: RTask): Observable<RTask>{
    return this.http.put<RTask>(`${this.apiUrl}/${_id}`, task )
  }

  deleteTask(_id: string): Observable<RTask>{
    return this.http.delete<RTask>(`${this.apiUrl}/${_id}`)
  }
}
