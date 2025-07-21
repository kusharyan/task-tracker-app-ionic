import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SqliteService } from './services/sqlite.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private sqlite: SqliteService) {

  }

  async initApp(){
    try{  
      await this.sqlite.initDB();
      console.log("SQLite initialized in AppComponent!");
    }catch(err){
      console.error("SQLite initialization failed!", err);
    }
  }
}
