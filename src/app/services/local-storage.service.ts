import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences'

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  async set(key: string, value: any): Promise<void>{
    await Preferences.set({ key, value: JSON.stringify(value)})
  }

  async get(key: string, value: any): Promise<any>{
    const result = await Preferences.get({key});
    return result.value ? JSON.parse(result.value) : null;  
  }

  async remove(key: string, value: any): Promise<void>{
    await Preferences.remove({key});
  }
}
