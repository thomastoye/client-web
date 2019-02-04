import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'team',
  template: `
  <div id='main_container'>
  <div style="max-width:800px;margin:0 auto">
  <img class="imageWithZoom" [src]="UI.currentTeamObj?.imageUrlMedium?UI.currentTeamObj?.imageUrlMedium:UI.currentTeamObj?.imageUrlThumb" style="object-fit:cover;margin:10px;border-radius:5px;max-height:150px;width:50%" (click)="showFullScreenImage(UI.currentTeamObj?.imageUrlOriginal)">
  <div style="font-size:18px;line-height:30px;font-family:sans-serif;">{{UI.currentTeamObj?.name}} {{UI.currentTeamObj?.familyName}}</div>
  <div class='sheet' style="margin-top:5px">
  <ul class='listLight'>
    <li *ngFor="let user of teamLeaders|async" (click)="router.navigate(['user',user.key])">
      <img [src]="user?.imageUrlThumb|async" style="float:left;object-fit:cover;height:50px;width:50px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{(user?.name|async)}}</div>
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">Leader</div>
    </li>
  </ul>
  <ul class='listLight'>
    <li *ngFor="let user of teamMembers|async" (click)="router.navigate(['user',user.key])">
      <img [src]="user?.imageUrlThumb|async" style="float:left;object-fit:cover;height:50px;width:50px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{user?.name|async}}</div>
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">Member</div>
    </li>
  </ul>
  <div *ngIf="parent!=undefined" style="cursor:pointer" (click)="router.navigate(['chat',parent])">
    <img [src]="parentImageUrlThumb|async" style="float:left;object-fit:cover;height:50px;width:75px;border-radius:3px;margin:5px 5px 5px 10px">
    <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{parentName|async}}</div>
    <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">Parent</div>
  </div>
  <div *ngIf="parent==undefined" style="margin-left:20px;color:#777;font-size:10px">{{UI.currentTeamObj?.name}} has no parent team</div>
  <ul class='listLight'>
    <li *ngFor="let team of teamChildren|async" (click)="router.navigate(['chat',team.key])">
      <img [src]="team?.imageUrlThumb|async" style="float:left;object-fit:cover;height:50px;width:75px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{team?.name|async}}</div>
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">Child</div>
    </li>
  </ul>
  </div>
  </div>
`,
})
export class TeamProfileComponent  {

  teamLeaders: Observable<any[]>;
  teamMembers: Observable<any[]>;
  teamChildren: Observable<any[]>;
  parent: string;
  parentName: Observable<{}>;
  parentImageUrlThumb: Observable<{}>;

  constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam = params.id;
      this.teamLeaders = this.db.list('PERRINNTeams/' + this.UI.currentTeam + '/leaders').snapshotChanges().pipe(map(changes => {
        return changes.map(c => ({
          key: c.payload.key,
          values: c.payload.val(),
          name: this.db.object('PERRINNTeams/' + c.payload.key + '/name').valueChanges(),
          imageUrlThumb: this.db.object('PERRINNTeams/' + c.payload.key + '/imageUrlThumb').valueChanges(),
        }));
      }));
      this.teamMembers = this.db.list('PERRINNTeams/' + this.UI.currentTeam + '/members').snapshotChanges().pipe(map(changes => {
        return changes.map(c => ({
          key: c.payload.key,
          values: c.payload.val(),
          name: this.db.object('PERRINNTeams/' + c.payload.key + '/name').valueChanges(),
          imageUrlThumb: this.db.object('PERRINNTeams/' + c.payload.key + '/imageUrlThumb').valueChanges(),
        }));
      }));
      this.db.object('PERRINNTeams/' + this.UI.currentTeam + '/parent').snapshotChanges().subscribe(changes => {
        this.parent = changes.payload.val().toString();
        this.parentName = this.db.object('PERRINNTeams/' + this.parent + '/name').valueChanges();
        this.parentImageUrlThumb = this.db.object('PERRINNTeams/' + this.parent + '/imageUrlThumb').valueChanges();
      });
      this.teamChildren = this.db.list('PERRINNTeams/' + this.UI.currentTeam + '/children').snapshotChanges().pipe(map(changes => {
        return changes.map(c => ({
          key: c.payload.key,
          values: c.payload.val(),
          name: this.db.object('PERRINNTeams/' + c.payload.key + '/name').valueChanges(),
          imageUrlThumb: this.db.object('PERRINNTeams/' + c.payload.key + '/imageUrlThumb').valueChanges(),
        }));
      }));
    });
  }

  showFullScreenImage(src) {
    let fullScreenImage = document.getElementById('fullScreenImage') as HTMLImageElement;
    fullScreenImage.src = src;
    fullScreenImage.style.visibility = 'visible';
  }

}
