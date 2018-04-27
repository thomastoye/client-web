import { Component } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import { firebase } from '@firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'help',
  template: `
  <div id='main_container'>
  <div class="sheet" style="background-color:#f5f5f5">
  <div class="title">What do you want to do?</div>
  <ul class="listLight">
    <li style="cursor:default" *ngFor="let service of services | async">
      <div style="padding:5px 10px 5px 10px">
        <div style="float:left;width:250px;font-size:11px;font-weight:bold;color:blue;cursor:pointer" (click)="UI.createMessage(service.regex,'','','','');router.navigate(['chat',this.UI.currentTeam])">{{service.regex}}</div>
      </div>
      <div class="seperator"></div>
    </li>
  </ul>
  <div style="text-align:center;padding:10px"><a style="font-size:10px" href='mailto:perrinnlimited@gmail.com'>Stuck? no problem, email PERRINN now</a></div>
  </div>
  </div>
  `,
})
export class HelpComponent {
  services: Observable<any[]>;

  constructor(public afAuth:AngularFireAuth,public db:AngularFireDatabase,public router:Router,public UI:userInterfaceService,private route:ActivatedRoute) {
    this.services=db.list('appSettings/PERRINNServices',ref=>ref.orderByChild('regex')).valueChanges();
  }

}
