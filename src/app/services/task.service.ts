import { Injectable } from '@angular/core';
import { RTask, Task } from '../model/task.model';
import { HttpClient } from '@angular/common/http';
import { Observable, pipe, Subject, switchMap, tap } from 'rxjs';
import { NetworkService } from './network.service';
import { SqliteService } from './sqlite.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://10.46.21.211:3000/api/tasks'; //IP address - 10.46.21.211 
  private taskSubject = new Subject<void>();
  taskSubject$ = this.taskSubject.asObservable();
  
  constructor(private http: HttpClient, private network: NetworkService, private sqlite: SqliteService) {
    this.sqlite.initDB();
  }
  
  tasksFetch(){
    this.taskSubject.next();
  }

  loadTasks(): Observable<RTask[]>{
    return this.http.get<RTask[]>(this.apiUrl)
  }

  getLocalTasks(): Promise<RTask[]>{
    return this.sqlite.getLocalTasks();
  }

  addTasks(task: Task): Observable<RTask>{
    return this.http.post<RTask>(this.apiUrl, task);
  }

  async syncOfflineTasks() {
    const unsyncedTasks = await this.sqlite.getUnsyncedTasks();
    for (let task of unsyncedTasks) {
      try {
        await this.http.post<RTask>(this.apiUrl, task).toPromise();
        await this.sqlite.markTaskAsSynced(task._id!);
      } catch (err) {
        console.error('Error syncing task', task._id);
      }
    }
  }

  updateTask(_id: string, task: RTask): Observable<RTask>{
    return this.http.put<RTask>(`${this.apiUrl}/${_id}`, task )
  }

  deleteTask(_id: string): Observable<RTask>{
    return this.http.delete<RTask>(`${this.apiUrl}/${_id}`)
  }
}
 //127.0.0.1:7555 mumu port number..