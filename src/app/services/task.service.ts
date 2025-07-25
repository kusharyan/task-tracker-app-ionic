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
  private apiUrl = 'http://10.46.20.116:3000/api/tasks';
  private taskSubject = new Subject<void>();
  taskSubject$ = this.taskSubject.asObservable();

  constructor(
    private http: HttpClient,
    private network: NetworkService,
    private sqlite: SqliteService
  ) {
    this.sqlite.initDB()
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
    console.log("Local Tasks: ", localTasks);

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
    const localId = uuidv4();

    // If offline, assign UUID
    const taskToSave = {
      ...task,
      _id: localId,
      synced,
      isDeleted: 0,
      isUpdated:0
    };

    await this.sqlite.addLocalTasks(taskToSave);

    if (isOnline) {
      try {
        let resp: any = await firstValueFrom(this.http.post(this.apiUrl, task));
        const updateQuery =
          'UPDATE tasks SET _id = ?, synced = ? WHERE _id = ?';
        const updvalues = [resp._id, 1, localId];
        await this.sqlite.sqlCommonMethod(updateQuery, updvalues);
        console.info(resp);
      } catch (err) {
        console.error('Add Task API failed, saved locally', err);
      }
    }
  }

  async updateTask(_id: string, task: RTask): Promise<void> {
    // return this.http.put<RTask>(`${this.apiUrl}/${_id}`, task );
    const isOnline = await firstValueFrom(this.network.isOnline$);
    const updatedTask = { ...task, synced: isOnline ? 1 : 0, isUpdated: isOnline ? 0 : 1};
    
    await this.sqlite.updateLocalTask(updatedTask);

    if (isOnline) {
      try {
        await firstValueFrom(
          this.http.put<RTask>(`${this.apiUrl}/${_id}`, task)
        );
      } catch (e) {
        console.error('Update failed online while sync later: ', e);
        const failedUpdateTask = {...task, synced: 0, isUpdated: 1};
        await this.sqlite.updateLocalTask(failedUpdateTask);
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
        console.log("task deleted successfully from server and local db!")
      } catch (e) {
        console.error('Delete failed Online.', e);
        const query = `UPDATE tasks SET isDeleted = 1, synced = 0 WHERE _id = ?`;
        await this.sqlite.sqlCommonMethod(query, [_id]);
      }
    } else {
      const query = `UPDATE tasks SET isDeleted = 1, synced = 0 WHERE _id = ?`;
      await this.sqlite.sqlCommonMethod(query, [_id]);
      console.log('Task marked for deletion, will sync when online');
    }
  }

  async syncOfflineTasks() {
    const allLocalTasks = await this.sqlite.getUnsyncedTasks();
    const deletedTasks = allLocalTasks.filter((task) => task.isDeleted === 1);
    const addTasks = allLocalTasks.filter((task) => task.synced === 0 && task.isDeleted === 0 && task.isUpdated === 0);
    const updatedTasks = allLocalTasks.filter((task) => task.isUpdated === 1 && task.isDeleted === 0);

      for (const task of addTasks) {
        try {
          const createdTask = await firstValueFrom(
            this.http.post<RTask>(this.apiUrl, task)
          );

          await this.sqlite.replaceTask(task._id!, {
            ...createdTask,
            synced: 1,
            isUpdated: 0,
            isDeleted: 0,
          });

          console.log(`Created task "${task.name}" synced`);
        } catch (err) {
          console.error(`Failed to sync new task "${task.name}"`, err);
        }
      }

    for (const task of updatedTasks) {
      try {
        await firstValueFrom(this.http.put(`${this.apiUrl}/${task._id}`, task));

        await this.sqlite.sqlCommonMethod(
          'UPDATE tasks SET synced = 1, isUpdated = 0 WHERE _id = ?',
          [task._id]
        );

        console.log(`Updated task "${task.name}" synced`);
      } catch (err) {
        console.error(`Failed to sync updated task "${task.name}"`, err);
      }
    }

    // Sync deleted tasks
    for (const task of deletedTasks) {
      try {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${task._id}`));
        await this.sqlite.deleteLocalTask(task._id!);
        console.log(`Deleted task "${task.name}" from server`);
      } catch (err) {
        console.error('Failed to delete task from server', task.name, err);
      }
    }
  }
}