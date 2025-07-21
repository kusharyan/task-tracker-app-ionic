import { Injectable } from '@angular/core';
import { RTask } from '../model/task.model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject } from 'rxjs';
import { NetworkService } from './network.service';
import { SqliteService } from './sqlite.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = 'http://10.46.22.66:3000/api/tasks'; //IP address - 10.46.21.211
  private taskSubject = new Subject<void>();
  taskSubject$ = this.taskSubject.asObservable();

  constructor(
    private http: HttpClient,
    private network: NetworkService,
    private sqlite: SqliteService
  ) {
    this.sqlite
      .initDB()
      .then(() => {
        console.log('SQLite initialized from Task Service!');
      })
      .catch((err) => console.error('Failed to initialize SQLite', err));

    this.network.isOnline$.subscribe((online) => {
      if (online) {
        this.syncOfflineTasks();
      }
    });
  }

  tasksFetch() {
    this.taskSubject.next();
  }

  async loadTasks(): Promise<RTask[]> {
    const localTasks = await this.sqlite.getLocalTasks();
    const isOnline = await firstValueFrom(this.network.isOnline$);
    if (isOnline) {
      try {
        const remoteTasks = await firstValueFrom(
          this.http.get<RTask[]>(this.apiUrl)
        );
        for (const task of remoteTasks) {
          this.sqlite.addLocalTasks({ ...task, synced: 1 });
        }
      } catch (e) {
        console.error(
          'Could not fetch from server, using local tasks only.',
          e
        );
      }
    }
    return this.sqlite.getLocalTasks();
    // return this.http.get<RTask[]>(this.apiUrl)
  }

  async addTasks(task: RTask): Promise<void> {
    const isOnline = await firstValueFrom(this.network.isOnline$);
    const synced = isOnline ? 1 : 0;
    const locald = uuidv4();

    // If offline, assign UUID
    const taskToSave = {
      ...task,
      _id: locald,
      synced,
      isDeleted:0
    };

    await this.sqlite.addLocalTasks(taskToSave);

    if (isOnline) {
      try {
        let resp : any = await firstValueFrom(this.http.post(this.apiUrl, task));
        const updateQuery = "UPDATE tasks SET _id = ?, synced = ? WHERE _id = ?";
        const updvalues = [resp._id, 1, locald];
        await this.sqlite.sqlCommonMethod(updateQuery,updvalues);
        console.info(resp)
      } catch (err) {
        console.error('Add Task API failed, saved locally', err);
      }
    }
  }

  async updateTask(_id: string, task: RTask): Promise<void> {
    // return this.http.put<RTask>(`${this.apiUrl}/${_id}`, task );
    const isOnline = await firstValueFrom(this.network.isOnline$);
    const updatedTask = { ...task, synced: isOnline ? 1 : 0 };

    await this.sqlite.updateLocalTask(updatedTask);

    if (isOnline) {
      try {
        await firstValueFrom(
          this.http.put<RTask>(`${this.apiUrl}/${_id}`, task)
        );
      } catch (e) {
        console.error('Update failed online while sync later: ', e);
      }
    }
  }

  async deleteTask(_id: string): Promise<void> {
    // return this.http.delete<RTask>(`${this.apiUrl}/${_id}`);
    const isOnline = await firstValueFrom(this.network.isOnline$);
    if (isOnline) {
      try {
        await firstValueFrom(this.http.delete<RTask>(`${this.apiUrl}/${_id}`));
        await this.sqlite.deleteLocalTask(_id);
      } catch (e) {
        console.error('Delete failed Online.');
      }
    } else {
      await this.sqlite.deleteLocalTask(_id);
    }
  }

  async syncOfflineTasks() {
    const localTasks = await this.sqlite.getLocalTasks();
    const unsyncedTasks = localTasks.filter((task) => task.synced === 0);

    for (const task of unsyncedTasks) {
      try {
        const createdTask = await firstValueFrom(
          this.http.post<RTask>(this.apiUrl, task)
        );
        // Replace local task UUID with backend _id
        await this.sqlite.replaceTask(task._id!, {
          ...createdTask,
          synced: 1,
        });

        console.log(`Synced task "${task.name}" to server`);
      } catch (err) {
        console.error('Sync failed for task', task.name, err);
      }
    }
  }
}
 //127.0.0.1:7555 mumu port number..