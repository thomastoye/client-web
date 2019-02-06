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
        this.currentUser = auth.uid;
        this.db.object('PERRINNTeams/' + this.currentUser).valueChanges().subscribe(snapshot => {
          this.currentUserObj = snapshot;
        });
        this.afs.collection<any>('PERRINNTeams/'+this.currentUser+'/viewTeams/').valueChanges().subscribe(snapshot => {
          this.currentUserTeamsObj = snapshot;
          this.globalChatActivity = false;
          snapshot.forEach(userTeam => {
            const chatActivity = (userTeam.lastMessageTimestamp > userTeam.lastChatVisitTimestamp);
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
        this.currentUser = null;
        this.focusUser = null;
        this.currentTeam = null;
      }
    });
  }

  createMessage(text, image, imageDownloadURL, linkTeamObj, linkUserObj) {
    text = text.replace(/(\r\n|\n|\r)/gm, '');
    if (text == '' && image == '') {return null; }
    this.analyseMessageText(text);
    if (this.processInputsInProgress()) {return null; }
    if (this.processInputsComplete()) {
      text = '';
      image = '';
      imageDownloadURL = '';
      linkTeamObj = {};
      linkUserObj = {};
    }
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
    if (this.processInputsComplete()) {
      updateObj['teamMessages/' + this.currentTeam + '/' + messageID + '/process'] = this.process[this.currentTeam];
    }
    this.db.database.ref().update(updateObj);
    this.timestampChatVisit();
    this.clearProcessData();
  }

  analyseMessageText(text) {
    let newProcess = false;
    this.services.forEach((service) => {
      const serviceRegex = new RegExp(service.val().regex, 'i');
      if (text.match(serviceRegex)) {
        if (service.val().process) {
          this.process[this.currentTeam] = {
            user: this.currentUser,
            service: service.key,
            regex: service.val().regex,
            message: service.val().process[1].message.text,
            step: 1,
            inputsComplete: false,
            inputs: {},
            inputsArray: [],
            function: service.val().process.function,
          };
          newProcess = true;
        }
      }
    });
    if (newProcess) {
      return null;
    }
    this.services.forEach((service) => {
      if (this.process !== undefined) {
        if (this.process[this.currentTeam] !== undefined) {
          if (service.key == this.process[this.currentTeam].service) {
            if (service.child('process').child(this.process[this.currentTeam].step).val().input) {
              const inputRegex = new RegExp(service.child('process').child(this.process[this.currentTeam].step).child('input').val().regex, 'i');
              const value = text.match(inputRegex);
              if (value) {
                const variable = service.child('process').child(this.process[this.currentTeam].step).child('input').val().variable;
                if (variable) {
                  const valueString = value[0];
                  this.process[this.currentTeam].inputs[variable] = valueString;
                  this.process[this.currentTeam].inputsArray.push([variable, valueString]);
                }
                if (!service.child('process').child(this.process[this.currentTeam].step + 1).val()) {
                  this.process[this.currentTeam].inputsComplete = true;
                }
                this.process[this.currentTeam].step += 1;
                if (!this.process[this.currentTeam].inputsComplete) {this.process[this.currentTeam].message = service.val().process[this.process[this.currentTeam].step].message.text; } else { this.process[this.currentTeam].message = ''; }
              }
            }
          }
        }
      }
    });
  }

  processInputsInProgress() {
    if (this.process[this.currentTeam] == undefined) {return false; }
    if (this.process[this.currentTeam] == null) {return false; }
    if (this.process[this.currentTeam].inputsComplete == undefined) {return false; }
    if (this.process[this.currentTeam].inputsComplete == null) {return false; }
    if (!this.process[this.currentTeam].inputsComplete) {return true; }
    return false;
  }

  processInputsComplete() {
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
    this.afs.doc<any>('PERRINNTeams/'+this.currentUser+/viewTeams/+this.currentTeam).update({
      lastChatVisitTimestamp: now,
      name: this.currentTeamObj.name,
      imageUrlThumb: this.currentTeamObj.imageUrlThumb ? this.currentTeamObj.imageUrlThumb : '',
    });
    this.db.object('subscribeTeamUsers/' + this.currentTeam).update({
      [this.currentUser]: true,
    });
  }

}
