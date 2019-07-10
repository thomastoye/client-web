import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { userInterfaceService } from './userInterface.service';
import { AngularFireStorage } from '@angular/fire/storage';
import * as firebase from 'firebase/app';

@Component({
  selector: 'team',
  template: `
  <div id='main_container'>
  <div style="max-width:800px;margin:0 auto">
  <img class="imageWithZoom" [src]="UI.currentTeamObj?.imageUrlMedium?UI.currentTeamObj?.imageUrlMedium:UI.currentTeamObj?.imageUrlThumb" style="object-fit:cover;margin:10px;border-radius:5px;max-height:150px;width:50%" (click)="showFullScreenImage(UI.currentTeamObj?.imageUrlOriginal)">
  <div style="font-size:18px;line-height:30px;margin:10px;font-family:sans-serif;">{{UI.currentTeamObj?.name}} {{UI.currentTeamObj?.familyName}}</div>
  <div class='sheet' style="margin-top:5px">
  <ul class='listLight'>
    <li *ngFor="let user of objectToArray(UI.currentTeamObj?.leaders)" (click)="router.navigate(['user',user.key])">
      <img [src]="user[1]?.imageUrlThumb" style="float:left;object-fit:cover;height:50px;width:50px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{user[1]?.name}}</div>
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">Leader</div>
    </li>
  </ul>
  <ul class='listLight'>
    <li *ngFor="let user of objectToArray(UI.currentTeamObj?.members)" (click)="router.navigate(['user',user.key])">
      <img [src]="user[1]?.imageUrlThumb" style="float:left;object-fit:cover;height:50px;width:50px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{user[1]?.name}}</div>
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">Member</div>
    </li>
  </ul>
  <div *ngIf="UI.currentTeamObj?.parent!=undefined" style="cursor:pointer" (click)="router.navigate(['chat',parent])">
    <img [src]="UI.currentTeamObj?.parent?.imageUrlThumb" style="float:left;object-fit:cover;height:50px;width:75px;border-radius:3px;margin:5px 5px 5px 10px">
    <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{UI.currentTeamObj?.parent?.name}}</div>
    <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">Parent</div>
  </div>
  <div *ngIf="UI.currentTeamObj?.parent==undefined" style="margin-left:20px;color:#777;font-size:10px">{{UI.currentTeamObj?.name}} has no parent team</div>
  <ul class='listLight'>
    <li *ngFor="let team of objectToArray(UI.currentTeamObj?.children)" (click)="router.navigate(['chat',team.key])">
      <img [src]="team[1]?.imageUrlThumb" style="float:left;object-fit:cover;height:50px;width:50px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{team[1]?.name}}</div>
      <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">Child</div>
    </li>
  </ul>
  <div *ngIf="UI.currentTeamObj?.leaders[UI.currentUser]" style="color:blue;;cursor:pointer;margin:20px">Add a member to this team</div>
  <div *ngIf="UI.currentTeamObj?.leaders[UI.currentUser]" style="color:blue;;cursor:pointer;margin:20px">Remove a member from this team</div>
  <div *ngIf="UI.currentTeamObj?.leaders[UI.currentUser]" style="color:blue;;cursor:pointer;margin:20px">Create a new child team</div>
  <div *ngIf="UI.currentTeamObj?.leaders[UI.currentUser]" style="color:blue;;cursor:pointer;margin:20px">
    <input type="file" name="chatImage" id="chatImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
    <label class="buttonUploadImage" for="chatImage" id="buttonFile">
    <div>Upload new team profile image</div>
    </label>
  </div>
  <div *ngIf="UI.currentTeamObj?.leaders[UI.currentUser]" style="color:blue;;cursor:pointer;margin:20px">Change team name</div>
  <div *ngIf="UI.currentTeamObj?.leaders[UI.currentUser]" style="color:blue;;cursor:pointer;margin:20px">Change team family name</div>
  </div>
  </div>
`,
})
export class TeamProfileComponent  {

  constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, private route: ActivatedRoute,private storage: AngularFireStorage, public afs: AngularFirestore) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam = params.id;
    });
  }

  showFullScreenImage(src) {
    const fullScreenImage = document.getElementById('fullScreenImage') as HTMLImageElement;
    fullScreenImage.src = src;
    fullScreenImage.style.visibility = 'visible';
  }

  onImageChange(event:any) {
    const image = event.target.files[0];
    const uploader = document.getElementById('uploader') as HTMLInputElement;
    const storageRef = this.storage.ref('images/' + Date.now() + image.name);
    const task = storageRef.put(image);

    task.snapshotChanges().subscribe((snapshot) => {
      document.getElementById('buttonFile').style.visibility = 'hidden';
      document.getElementById('uploader').style.visibility = 'visible';

      const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      uploader.value = percentage.toString();
    },
    (err:any) => {
      document.getElementById('buttonFile').style.visibility = 'visible';
      document.getElementById('uploader').style.visibility = 'hidden';
      uploader.value = '0';
    },
    () => {
      uploader.value = '0';
      document.getElementById('buttonFile').style.visibility = 'visible';
      document.getElementById('uploader').style.visibility = 'hidden';
      let draftMessage = task.task.snapshot.ref.name.substring(0, 13);
      let draftImage = task.task.snapshot.ref.name.substring(0, 13);
      storageRef.getDownloadURL().subscribe(url => {
        this.UI.createMessage(draftMessage,draftImage,url,'','');
        event.target.value = '';
        this.router.navigate(['chat',this.UI.currentTeam]);
      });
    });
  }

  objectToArray(obj) {
    if (obj == null) { return null; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

}
