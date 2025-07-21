import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private _isOnline = new BehaviorSubject<boolean>(true);
  isOnline$ = this._isOnline.asObservable();

  constructor() { 
    this.initNetwork();
  }

  private async initNetwork(){
    const status = await Network.getStatus();
    this._isOnline.next(status.connected);
    Network.addListener('networkStatusChange', status=>{
      this._isOnline.next(status.connected)
    })
  }

  get isOnline(): boolean{
    return this._isOnline.value;
  }
}
