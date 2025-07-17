import { Injectable } from '@angular/core';
import { SQLiteDBConnection, CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
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
    this.initDB();
  }

  async initDB() {
    try {
      const databaseExists = await this.sqlite?.isConnection(this.dbName, true);
      console.log('Connection Already Exists: ', databaseExists);

      if (databaseExists?.result) {
        this.db = await this.sqlite?.retrieveConnection(this.dbName, true);
        console.log('Retrieve Database: ');
      } else {
        this.db = await this.sqlite?.createConnection(
          'taskDb',
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
          synced BOOLEAN)`);
      }
    } catch (err) {
      console.error('SQLite Init error: ', err);
    }
  }

  async addLocalTasks(task: RTask) {
    if (!this.db) return;
    const completed = task.completed ? 1 : 0;
    const synced = 0;

    const query = `INSERT INTO tasks (_id, userId, name, description, completed, createdAt, synced) VALUES ( ?, ?, ?, ?, ?, ?)`;

    const values = [
      task._id,
      task.userId,
      task.name,
      task.description,
      task.completed,
      task.createdAt,
      synced,
    ];
    await this.db.run(query, values);
  }

  async getLocalTasks(): Promise<RTask[]> {
    if (!this.db) return [];
    const result = await this.db.query(`SELECT * FROM tasks`);
    return (
      result.values?.map((t) => ({
        _id: t._id,
        userId: t.userId,
        name: t.name,
        description: t.description,
        completed: t.completed,
        createdAt: t.creadtedAt,
      })) || []
    );
  }

  async deleteLocalTask(_id: string) {
    if (!this.db) return;
    try {
      await this.db.run(`DELETE FROM tasks WHERE _id = ?`, [_id]);
    } catch (err) {
      console.error(err);
    }
  }

  async updateLocalTask(task: RTask) {
    if (!this.db) return;
    try {
      const completed = task.completed ? 1 : 0;
      const query = `UPDATE tasks SET name = ?, description = ?, completed = ? WHERE _id = ?`;
      await this.db.run(query, [
        task.name,
        task.description,
        completed,
        task._id,
      ]);
    } catch (err) {
      console.error(err);
    }
  }

  async getUnsyncedTasks(): Promise<RTask[]> {
    if (!this.db) {
      console.log('DB initialization error');
      return [];
    }
    const res = await this.db?.query('SELECT * FROM tasks WHERE synced = 0');
    return res?.values || [];
  }

  async markTaskAsSynced(_id: string) {
    try {
      const query = `UPDATE tasks SET synced = 1 WHERE _id = ?;`;
      await this.db?.run(query, [_id]);
    } catch (err) {
      console.error(err);
    }
  }

  async clearLocalTasks() {
    if (!this.db) {
      console.log('DB initialization error');
      return;
    }
    try {
      await this.db.execute('DELETE FROM tasks');
    } catch (err) {
      console.error(err);
    }
  }
}