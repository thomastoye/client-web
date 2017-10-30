import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'notes',
  template: `
  <div class="sheet">
  <span class="title">Notes</span>
  <span class="buttonDiv" *ngIf='currentUserIsMember' style="border-style:none" (click)="editMode=!editMode">{{editMode?"Done":"Edit"}}</span>
  <div class="buttonDiv" *ngIf="currentUserIsMember" style="float:right;margin:10px" (click)="newNote()">New note</div>
  <div style="clear:both;text-align:center;font-size:18px;font-family:sans-serif;">{{teamName}}</div>
  </div>
  <ul>
    <li *ngFor="let note of teamNotes | async;let i = index">
      <div class="sheet" style="position:relative">
        <input type="text" class="inputTitle" maxlength="25" (readonly)="currentUserIsMember" #elementTitle (focusout)="db.object('teamNotes/'+UI.currentTeam+'/'+note.$key).update({title:elementTitle.value})" [value]="note.title">
        <div class="note" *ngIf="!editMode" maxlength="500" (readonly)="currentUserIsMember" #elementNote (focusout)="db.object('teamNotes/'+UI.currentTeam+'/'+note.$key).update({note:elementNote.value})" [innerHTML]="note.note | linky"></div>
        <textarea class="note" *ngIf="editMode" rows="20" maxlength="2000" #elementNote (focusout)="db.object('teamNotes/'+UI.currentTeam+'/'+note.$key).update({note:elementNote.value})" [value]="note.note"></textarea>
        <div style="position:absolute;top:0px;right:5px;font-size:10px;color:red;cursor:pointer" *ngIf="editMode" (click)="db.object('teamNotes/'+UI.currentTeam+'/'+note.$key).remove()">Remove</div>
      </div>
    </li>
  </ul>
  `,
})

export class NotesComponent  {

  teamName: string;
  teamNotes: FirebaseListObservable<any>;
  currentUserIsMember: boolean;
  editMode: boolean;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam=params['id'];
      this.editMode = false;
      this.currentUserIsMember=false;
      this.db.object('teams/'+this.UI.currentTeam).subscribe (team=>{
        this.teamName = team.name;
      });
      this.db.object('teamUsers/'+this.UI.currentTeam+'/'+this.UI.currentUser).subscribe(teamUser=>{
        if (teamUser!=null && teamUser.member) {this.currentUserIsMember=true}
      });
      this.teamNotes = db.list('teamNotes/'+this.UI.currentTeam);
    });
  }

  newNote () {
    this.db.list('teamNotes/'+this.UI.currentTeam).push({title:"Title",note:"note"});
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}
