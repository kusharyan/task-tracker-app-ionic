import { Injectable } from '@angular/core';
import {
  SQLiteDBConnection,
  CapacitorSQLite,
  SQLiteConnection,
} from '@capacitor-community/sqlite';
import { RTask, Task } from '../model/task.model';

@Injectable({
  providedIn: 'root',
})
export class SqliteService {
  private sqlite: SQLiteConnection | undefined;
  private db: SQLiteDBConnection | undefined;
  private dbName = 'taskDb';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initDB() {
    try {
      const dbName = this.dbName;
      const consistency = await this.sqlite?.checkConnectionsConsistency();
      const isConnected = await this.sqlite?.isConnection(dbName, false);
      console.log('Connection Already Exists: ', isConnected);

      if (isConnected?.result) {
        this.db = await this.sqlite?.retrieveConnection(dbName, true);
        console.log('Retrieve Database: ');
      } else {
        this.db = await this.sqlite?.createConnection(
          dbName,
          false,
          'no-encryption',
          1,
          false
        );

        await this.db?.open();

        await this.db?.execute(`CREATE TABLE IF NOT EXISTS tasks(
          _id TEXT PRIMARY KEY,
          userId TEXT,
          name TEXT NOT NULL,
          description TEXT,
          completed INTEGER DEFAULT 0,
          createdAt TEXT,
          synced INTEGER DEFAULT 0,
          isDeleted INTEGER DEFAULT 0,
          isUpdated INTEGER DEFAULT 0)`);
      }
    } catch (err) {
      console.error('SQLite Init error: ', err);
    }
  }

  async addLocalTasks(task: RTask) {
    if (!this.db) return;
    // const isCompleted = task.completed ? 1 : 0;
    // const synced = 0;

    const query = `INSERT OR REPLACE INTO tasks (_id, userId, name, description, completed, createdAt, synced, isDeleted, isUpdated) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      task._id,
      task.userId,
      task.name,
      task.description,
      task.completed ? 1 : 0,
      task.createdAt,
      task.synced ?? 0,
      task.isDeleted ?? 0,
      task.isUpdated ?? 0
    ];
    await this.db.run(query, values);
  }

  async getLocalTasks(): Promise<RTask[]> {
    if (!this.db) return [];
    const result = await this.db.query(
      `SELECT * FROM tasks WHERE isDeleted = 0`
    );
    return (
      result.values?.map((t) => ({
        _id: t._id,
        userId: t.userId,
        name: t.name,
        description: t.description,
        completed: !!t.completed,
        createdAt: t.createdAt,
        synced: t.synced,
      })) || []
    );
  }

  async deleteLocalTask(_id: string) {
    if (!this.db) return;
    try {
      const query = `DELETE FROM tasks WHERE _id = ?`;
      await this.db.run(query, [_id]);
    } catch (err) {
      console.error('ERROR Occurred while deleting local tasks: ', err);
    }
  }

  async updateLocalTask(task: RTask): Promise<void> {
    if (!this.db) return;
    try {
      // const completed = task.completed ? 1 : 0;
      const query = `UPDATE tasks SET name = ?, description = ?, completed = ?, synced = ?, isUpdated = ? WHERE _id = ?`;
      await this.db.run(query, [
        task.name,
        task.description,
        task.completed ? 1 : 0,
        task.synced ?? 0,
        1,
        task._id,
      ]);
    } catch (err) {
      console.error('ERROR Occurred while updating local tasks: ', err);
    }
  }

  async getUnsyncedTasks(): Promise<RTask[]> {
    if (!this.db) return [];
    const res = await this.db?.query('SELECT * FROM tasks WHERE synced = 0 OR isUpdated = 1 OR isDeleted = 1');
    return (
      res?.values?.map((t) => ({
        _id: t._id,
        userId: t.userId,
        name: t.name,
        description: t.description,
        completed: !!t.completed,
        createdAt: t.createdAt,
        synced: t.synced,
        isDeleted: t.isDeleted
      })) || []
    );
  }

  // async markTaskAsSynced(_id: string) {
  //   try {
  //     const query = `UPDATE tasks SET synced = 1 WHERE _id = ?`;
  //     await this.db?.run(query, [_id]);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }

  async replaceTask(localId: string, newTask: RTask) {
    await this.deleteLocalTask(localId);
    await this.addLocalTasks({...newTask, synced: 1, isUpdated: 0, isDeleted: 0});
  }

  // async clearLocalTasks() {
  //   if (!this.db) {
  //     console.log('DB initialization error');
  //     return;
  //   }
  //   try {
  //     await this.db.execute('DELETE FROM tasks');
  //   } catch (err) {
  //     console.error('ERROR Occurred while clearing local tasks: ', err);
  //   }
  // }

  async sqlCommonMethod(query: string, values: any[] | undefined) {
    if (!this.db) return;
    try {
      await this.db.run(query, values);
    } catch (err) {
      console.error('ERROR Occurred while updating local tasks: ', err);
    }
  }
}
