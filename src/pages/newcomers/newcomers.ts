import { Component, Inject } from '@angular/core';
import { NavController, NavParams, Platform, ToastController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as moment from 'moment';
import 'moment/locale/uk';
import 'moment/locale/ru';
import 'moment/locale/en-gb';

import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';
import { Access } from '../../utils/access';
import { Images } from '../../utils/images';


@Component({
  selector: 'page-newcomers',
  templateUrl: 'newcomers.html',
})
export class Newcomers {
  
  // title: string;
  guid:string;
  access_token : string;
  digest : string;
  newcomers : any;

  monthArr : any;
  weekArr : any;
  yesterdayArr : any;
  todayArr : any;

  backbuttonPressed : number;

  constructor(public platform : Platform, public toastCtrl : ToastController, public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization,@Inject(Access) public access : Access,@Inject(Images) public images: Images,public http : Http) {
    // this.title = navParams.data.title || loc.dic.modules.News;//New Employees
    this.guid = navParams.data.guid;
    this.newcomers = 'today';
    this.backbuttonPressed = 0;

    Promise.all([access.getToken().then(token => this.access_token = token),access.getDigestValue().then(digest => this.digest = digest)])
      .then(()=>{
        moment.locale(this.loc.localization);
        this.getToday();
      }) 
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

  public getToday() : void {
    let target = '<View>'+
									'<Query>'+
											'<Where>'+
												'<Eq><FieldRef Name=\'LSiHireDate\' /><Value Type=\'DateTime\'><Today /></Value></Eq>'+
											'</Where>'+
									'</Query>' +
				    			'</View>';

    this.getUsers(target).then(users=>{
      this.todayArr = users;
    })
  }

  public getYesterday() : void {
    let target = '<View>'+
										'<Query>'+
												'<Where>'+
													'<Eq><FieldRef Name=\'LSiHireDate\' /><Value Type=\'DateTime\'><Today OffsetDays="-1" /></Value></Eq>'+
												'</Where>'+
										'</Query>' +
					    			'</View>';

    this.getUsers(target).then(users=>{
      this.yesterdayArr = users;
    })
  }

  public getWeek() : void {
    let target = '<View>'+
									'<Query>'+
											'<Where>'+
												'<And> \
													<Geq><FieldRef Name=\'LSiHireDate\' /><Value Type=\'DateTime\'><Today OffsetDays="-7" /></Value></Geq> \
													<Leq><FieldRef Name=\'LSiHireDate\' /><Value Type=\'DateTime\'><Today /></Value></Leq> \
												</And>'+
											'</Where>'+
									'</Query>' +
				    			'</View>';

    this.getUsers(target).then(users=>{
      this.weekArr = users;
    })
  }

  public getMonth() : void {
     let target = '<View>'+
									'<Query>'+
											'<Where>'+
												'<And> \
													<Geq><FieldRef Name=\'LSiHireDate\' /><Value Type=\'DateTime\'><Today OffsetDays="-30" /></Value></Geq> \
													<Leq><FieldRef Name=\'LSiHireDate\' /><Value Type=\'DateTime\'><Today /></Value></Leq> \
												</And>' +
											'</Where>'+
											'<OrderBy> \
												<FieldRef Name="LSiHireDate" Ascending="FALSE"/> \
											</OrderBy>' + 
									'</Query>' +
				    			'</View>';

    this.getUsers(target).then(users=>{
      this.monthArr = users;
    })
  }

  private getUsers(target) : Promise<any> {
    let url = `${consts.siteUrl}/_api/web/lists(guid'${this.guid}')/getitems`
    let body = {
      query : {
        '__metadata': {
           type: 'SP.CamlQuery' 
        },
        ViewXml: target 
      }
    }

    let headers = new Headers({"Authorization":(window.localStorage.getItem('OnPremise')?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'Accept': 'application/json;odata=verbose',"Content-Type": "application/json;odata=verbose"});
    let options = new RequestOptions({ headers: headers });

    return this.http.post(url,JSON.stringify(body),options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        return res.json().d.results.map(item=>{
          item.MyHireDay = item.LSiHireDate? moment(item.LSiHireDate).date() : ' ';
          item.MyHireMonth = item.LSiHireDate? moment(item.LSiHireDate).format('MMM').toString().toLowerCase() : ' ';
          return item;
        });
      })
      .catch(error=>{console.log('<Newcomers> error getUsers:',error);return [];})
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
