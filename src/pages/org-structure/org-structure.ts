import { Component, Inject } from '@angular/core';
import { NavController, NavParams, ToastController, Platform } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';
import { Images } from '../../utils/images';

import { DepartmentUsers } from './department_users/department_users'

@Component({
  selector: 'page-org-structure',
  templateUrl: 'org-structure.html',
})
export class OrgStructure {

  title: string;
  guid:string;
  usersListId : string;
  Depts : any;
  Users : any;
  backbuttonPressed : number;

  
  constructor(public platform : Platform, public toastCtrl : ToastController, public navCtrl: NavController, public navParams: NavParams,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization, public http : Http) {
    this.title = navParams.data.title;
    this.guid = navParams.data.guid;
    this.backbuttonPressed = 0;

    this.usersListId = JSON.parse(window.localStorage.getItem('lsi'))['LSiUsers'];
    this.getDepartments();
    this.getUsers();
  }

  ionViewDidEnter(){
    this.platform.registerBackButtonAction((e)=>{
      if(this.backbuttonPressed == 0){
        this.showToast(this.loc.dic.mobile.Exit);
        this.backbuttonPressed = 1;
      } else
        this.platform.exitApp();
      return false;
    },100);
  }

  private getDepartments() : Promise<any>{
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/items?$select=Id,Title,ParentDepID,DepManager/Id,DepManager/Name,DepManager/Title,DepManager/EMail&$expand=DepManager/Id`;
    
    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        this.Depts = res.json().d.results;
      })
      .catch(error=>{
        console.log('<OrgStructure> get departments error:',error);
        this.Depts = [];
      })
  }

  private getUsers() : Promise<any> {
     let url = `${consts.siteUrl}/_api/web/lists('${this.usersListId}')/items?$select=Id,User1Id,IDDepartment,Title,JobTitle,LSiWorkPhone,LSiMobilePhone,LSiWorkEmail,LSiHomePhone,UserEmail`;
    
    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        this.Users = res.json().d.results;
      })
      .catch(error=>{
        console.log('<OrgStructure> get users error:',error);
        this.Users = [];
      })
  }

  public revealDepts(item){
    this.Depts.map(child => {
      child.ParentDepID == item.Id && (child.revealed = !child.revealed);
    })
  }

  public openDept(item) : void {
    this.navCtrl.push(DepartmentUsers,{
        users : this.Users,
        dept : item,
        Title : item.Title
    })
  }

  private showToast(message: any){
    let toast = this.toastCtrl.create({
      message: (typeof message == 'string' )? message.substring(0,( message.indexOf('&#x') != -1? message.indexOf('&#x') : message.length)) : message.toString().substring(0,( message.toString().indexOf('&#x') != -1 ?message.toString().indexOf('&#x') : message.toString().length)) ,
      position: 'bottom',
      showCloseButton : true,
      duration: 9000
    });
    toast.present();
    toast.onDidDismiss((a,b)=>{
      this.backbuttonPressed = 0;
    })
}

}
