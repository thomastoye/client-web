import { Injectable }    from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

@Injectable()
export class userInterfaceService {
  globalChatActivity: boolean;
  loading: boolean;
  focusUser: string;
  focusUserObj: any;
  currentTeam: string;
  currentTeamObj: any;
  currentTeamObjKey: string;
  currentUser: string;
  currentUserObj: any;
  currentUserTeamsObj: any;
  services: any;
  process: any;

  constructor(private afAuth: AngularFireAuth, public db: AngularFireDatabase, public afs: AngularFirestore,) {
    this.process = {};
    this.afAuth.user.subscribe((auth) => {
      if (auth != null) {
        this.currentUser=auth.uid;
        afs.doc<any>('PERRINNTeams/'+this.currentUser).valueChanges().subscribe(snapshot=>{
          this.currentUserObj = snapshot;
        });
        afs.collection<any>('PERRINNTeams/'+this.currentUser+'/viewTeams/').valueChanges().subscribe(snapshot=>{
          this.currentUserTeamsObj = snapshot;
          this.globalChatActivity = false;
          snapshot.forEach(userTeam => {
            let chatActivity:boolean=false;
            if(userTeam.lastChatVisitTimestamp!=undefined)chatActivity=(userTeam.lastMessageTimestamp>userTeam.lastChatVisitTimestamp);
            else if(userTeam.lastMessageTimestamp!=undefined)chatActivity=true;
            else chatActivity=false;
            if (chatActivity) {
              this.globalChatActivity = true;
            }
            document.title = this.globalChatActivity ? '(!) PERRINN' : 'PERRINN';
          });
        });
        if (this.focusUser == null) { this.focusUser = auth.uid; }
        this.db.database.ref('appSettings/PERRINNServices/').once('value').then(services => {
          this.services = services;
        });
      } else {
        this.currentUser=null;
        this.focusUser=null;
        this.currentTeam=null;
      }
    });
  }

  createMessage(text, image, imageDownloadURL, linkTeamObj, linkUserObj) {
    text = text.replace(/(\r\n|\n|\r)/gm, '');
    if (text == '' && image == '' && !this.IsProcessInputsComplete()) return null;
    const now = Date.now();
    const messageID = this.db.list('ids/').push(true).key;
    const updateObj = {};
    updateObj['teamMessages/' + this.currentTeam + '/' + messageID + '/payload'] = {
      timestamp: now,
      text,
      user: this.currentUser,
      name: this.currentUserObj.name,
      imageUrlThumbUser: this.currentUserObj.imageUrlThumb,
      image,
      imageDownloadURL,
      linkTeam: linkTeamObj.key ? linkTeamObj.key : null,
      linkTeamName: linkTeamObj.name ? linkTeamObj.name : null,
      linkTeamImageUrlThumb: linkTeamObj.imageUrlThumb ? linkTeamObj.imageUrlThumb : null,
      linkUser: linkUserObj.key ? linkUserObj.key : null,
      linkUserName: linkUserObj.name ? linkUserObj.name : null,
      linkuserFamilyName: linkUserObj.familyName ? linkUserObj.familyName : null,
      linkUserImageUrlThumb: linkUserObj.imageUrlThumb ? linkUserObj.imageUrlThumb : null,
    };
    if (this.IsProcessInputsComplete()) {
      updateObj['teamMessages/' + this.currentTeam + '/' + messageID + '/process'] = this.process[this.currentTeam];
    }
    this.db.database.ref().update(updateObj);
    this.timestampChatVisit();
    this.clearProcessData();
  }

  IsProcessInputsComplete() {
    if (this.process[this.currentTeam] == undefined) {return false; }
    if (this.process[this.currentTeam] == null) {return false; }
    if (this.process[this.currentTeam].inputsComplete == undefined) {return false; }
    if (this.process[this.currentTeam].inputsComplete == null) {return false; }
    if (this.process[this.currentTeam].inputsComplete) {return true; }
    return false;
  }

  clearProcessData() {
    this.process[this.currentTeam] = {};
  }

  timestampChatVisit() {
    if (this.currentTeamObjKey != this.currentTeam) {return; }
    const now = Date.now();
    this.afs.doc<any>('PERRINNTeams/'+this.currentUser+/viewTeams/+this.currentTeam).set({
      lastChatVisitTimestamp: now,
      name: this.currentTeamObj.name,
      imageUrlThumb: this.currentTeamObj.imageUrlThumb ? this.currentTeamObj.imageUrlThumb : '',
    },{merge:true});
    this.db.object('subscribeTeamUsers/' + this.currentTeam).update({
      [this.currentUser]: true,
    });
  }

}
