export interface Task{
  name: string;
  description: string;
  completed: boolean
}

export interface RTask{
  _id?: string;
  userId: string;
  name: string
  description: string;
  completed: boolean;
  createdAt?: string
  synced?: number;
}