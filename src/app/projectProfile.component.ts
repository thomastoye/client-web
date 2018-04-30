import { Component } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { firebase } from '@firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'projecProfile',
  template: `
  <div id='main_container'>
  <div style="max-width:800px;margin:0 auto">
  <div style="float: left; width: 60%;">
  <div class='title' style="float:left">{{(projectObj|async)?.name}}</div>
  <div style="clear:both"></div>
  <div style="padding:10px;font-size:12px" [innerHTML]="((projectObj|async)?.goal)|linky"></div>
  </div>
  <div style="float: right; width: 40%;position:relative">
  <img class="imageWithZoom" [src]="projectImageUrlThumb" style="object-fit:contain; height:200px; width:100%" (click)="showFullScreenImage(projectImageUrlOriginal)">
  </div>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Teams</div>
  <ul class="listLight">
    <li *ngFor="let team of projectTeams | async"
      [class.selected]="team.key === UI.currentTeam"
      (click)="router.navigate(['chat',team.key])">
      <img [src]="team?.imageUrlThumb|async" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div style="width:300px;height:25px;float:left;">{{team?.name|async}}</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
    <div class="title">Document</div>
    <iframe id='iframeDocument' width='100%' height='10000'></iframe>
  </div>
  </div>
  `,
})
export class ProjectProfileComponent {
  memberStatus: string;
  leaderStatus: boolean;
  messageCancelMembership: string;
  projectTeams:Observable<any[]>;
  projectObj:{};
  projectImageUrlThumb:string;
  projectImageUrlOriginal:string;

  constructor(public db:AngularFireDatabase,public router:Router,public UI:userInterfaceService,private route:ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.focusProject=params['id'];
      this.messageCancelMembership = ""
      this.projectObj=db.object('projects/'+this.UI.focusProject).valueChanges();
      db.object('projects/'+this.UI.focusProject+'/image').snapshotChanges().subscribe(image=>{
        db.object('PERRINNImages/'+image.payload.val()).snapshotChanges().subscribe(image=>{
          if(image.payload.val()!=null)this.projectImageUrlThumb=image.payload.val().imageUrlThumb;
          if(image.payload.val()!=null)this.projectImageUrlOriginal=image.payload.val().imageUrlOriginal;
        });
      });
      this.projectTeams=db.list('projectTeams/'+this.UI.focusProject,ref=>ref.orderByChild('member').equalTo(true)).snapshotChanges().map(changes=>{
        return changes.map(c=>({
          key:c.payload.key,
          values:c.payload.val(),
          name:db.object('PERRINNTeams/'+c.payload.key+'/name').valueChanges(),
          imageUrlThumb:db.object('PERRINNTeams/'+c.payload.key+'/imageUrlThumb').valueChanges(),
        }));
      });
    });
  }

  ngOnInit() {
    var iframeDocument=<HTMLImageElement>document.getElementById('iframeDocument');
    this.db.object('projects/'+this.UI.focusProject+'/document').snapshotChanges().subscribe(document=>{
      console.log(document.payload.val());
      if(document.payload.val()!=null)iframeDocument.src=document.payload.val();
    });
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

  cancelMember(projectID: string, teamID: string) {
    this.db.object('projectTeams/' + projectID + '/' + teamID).update({member:false})
    .then(_ => this.router.navigate(['team',teamID]))
    .catch(err => this.messageCancelMembership="Error: Only a leader can cancel a membership - A leader's membership cannot be cancelled");
  }

}
