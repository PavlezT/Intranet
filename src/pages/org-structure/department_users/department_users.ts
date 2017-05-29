import { Component, Inject } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

import { CallNumber } from '@ionic-native/call-number';

import { Localization } from '../../../utils/localization';
import { Images } from '../../../utils/images';

@Component({
  selector: 'department_users',
  templateUrl: 'department_users.html',
})
export class DepartmentUsers {

  Title: string;
  guid:string;
  Users : any;
  
  constructor(public navParams: NavParams,public viewCtrl: ViewController,@Inject(Images) public images: Images,public callNumber: CallNumber, @Inject(Localization) public loc : Localization) {
    this.Title = navParams.data.Title;
    this.guid = navParams.data.guid;
    this.Users = navParams.data.users.filter(user=>{
      if(user.IDDepartment == this.guid) return user;
    });
  }

  public dismiss() : void {
    this.viewCtrl.dismiss();
  }

  public makeCall(number) : void {
    this.callNumber.callNumber(number, true)
      .then(() => console.log('Launched dialer!'))
      .catch((err) => console.log('Error launching dialer:',err));
  }

  // ionViewDidEnter(){
  //   this.platform.registerBackButtonAction((e)=>{this.dismiss();return false;},100);
  // }
  
  // ionViewCanLeave(){
  //   this.platform.registerBackButtonAction((e)=>{this.platform.exitApp();return false;},100);
  // }

}
