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
  Depts : Array<{Id:number,Title:string,ParentDepID:number,DepManager:any,revealed : boolean}>;
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
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/items?$select=Id,Title,ParentDepID,DepManager/Id,DepManager/Name,DepManager/Title,DepManager/EMail&$expand=DepManager/Id&$top=5000`;
    
    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        let DeptsTemp : Array<{Id:number,Title:string,ParentDepID:number,DepManager:any,revealed : boolean}> = res.json().d.results;
        this.Depts = [];
        DeptsTemp.sort((a,b)=>{
          if(a.ParentDepID < b.ParentDepID)
            return 1
          else 
            return 0;
        })
        for(let dept = DeptsTemp[0],i = 0;i<DeptsTemp.length;i++,dept=DeptsTemp[i]){
          if(dept.ParentDepID != 0 ){
             let temp = DeptsTemp.splice(i,1)[0];
                let index = DeptsTemp.findIndex(item=>{return item.Id == dept.ParentDepID?true : false});
                let tempmas = DeptsTemp.splice(index+1,DeptsTemp.length);
                DeptsTemp.push(temp);
                DeptsTemp=DeptsTemp.concat(tempmas);
                if(i<=index )i = i-1;
            }
        }
        this.Depts = DeptsTemp;
      })
      .catch(error=>{
        console.log('<OrgStructure> get departments error:',error);
        this.Depts = [];
      })
  }

  private getUsers() : Promise<any> {
     let url = `${consts.siteUrl}/_api/web/lists('${this.usersListId}')/items?$select=Id,User1Id,IDDepartment,Title,JobTitle,LSiWorkPhone,LSiMobilePhone,LSiWorkEmail,LSiHomePhone,UserEmail&$top=5000`;
    
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

  public revealDepts(item, revealed?){
    this.Depts.map(child => {
      if(child.ParentDepID == item.Id) {
        child.revealed = (revealed == false? revealed : !child.revealed);
        this.revealDepts(child,false);
      }
    })
  }

  public openDept(item) : void {
    this.navCtrl.push(DepartmentUsers,{
        users : this.Users,
        depts : this.Depts,
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
