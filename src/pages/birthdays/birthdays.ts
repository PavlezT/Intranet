import { Component, Inject } from '@angular/core';
import { NavController, Platform, NavParams, ToastController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as moment from 'moment';
import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';
import { Access } from '../../utils/access';
import { Images } from '../../utils/images';

import { GreetingCard } from './greeting_card/greeting_card';

@Component({
  selector: 'page-birthdays',
  templateUrl: 'birthdays.html',
})
export class Birthdays {

  title: string;
  guid:string;
  birth: any;
  access_token : string;
  digest : string;

  todayArr : any;
  tomorrowArr : any;
  weekArr : any;
  monthArr : any;
  backbuttonPressed : number;

  constructor(public platform : Platform, public toastCtrl : ToastController, public navCtrl: NavController, public navParams: NavParams, @Inject(Access) public access : Access,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization,public http : Http) {
    this.title = navParams.data.title || loc.dic.modules.News;
    this.guid = navParams.data.guid;
    this.birth = 'today';
    this.backbuttonPressed = 0;

    moment.locale(this.loc.localization);

    Promise.all([access.getToken().then(token => this.access_token = token),access.getDigestValue().then(digest => this.digest = digest)])
      .then(()=>{
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

  private getBirthUsers(target : string) : Promise<any> {
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/GetItems(Query=@target)?$select=UserEmail,LSiBirthdayD,LSiBirthdayM,Title,Id,User1Id,JobTitle&$top=50&@target={"ViewXml":"${target}"}`;

    let headers = new Headers({"Authorization":(consts.OnPremise?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'Accept': 'application/json;odata=verbose'});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.post(url,{},options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(response=>{
        return response.json().d.results.map(item=>{
          item.BDate = moment({M:item.LSiBirthdayM-1,d:item.LSiBirthdayD}).format('D MMMM');
          return item;
        });
      })
      .catch(error=>{
        console.log('<BirthDays> getBirthUsers error:',error);
        return [];
      })
  }

  public getToday() : void {
    let target =  '<View>'
        +'<Query>'
							+'<Where><And>'
								+`<Eq><FieldRef Name=\'LSiBirthdayD\' /><Value Type=\'Number\'>${moment().date()}</Value></Eq>`
								+`<Eq><FieldRef Name=\'LSiBirthdayM\' /><Value Type=\'Number\'>${(moment().month() + 1)}</Value></Eq>`
							+'</And></Where>'
				+'</Query>'
    	+'</View>';

    this.getBirthUsers(target).then(users=>{
      this.todayArr = users;
    })
  }

  public getTomorrow() : void {
    let target = '<View>'+
						'<Query>'+
								'<Where><And>'+
									'<Eq><FieldRef Name=\'LSiBirthdayD\' /><Value Type=\'Number\'>'+ moment().add(1,'day').date() +'</Value></Eq>'+
									'<Eq><FieldRef Name=\'LSiBirthdayM\' /><Value Type=\'Number\'>'+ (moment().month() + 1) +'</Value></Eq>'+
								'</And></Where>'+
						'</Query>' +
	    			'</View>';

    this.getBirthUsers(target).then(users=>{
      this.tomorrowArr = users;
    })
  }

  public getWeek() : void {
    let startOfWeek = moment().startOf('week'),
					endOfWeek = moment().endOf('week');
					
		let target = (startOfWeek.month() ===  endOfWeek.month()) ?						
					'<View>'+
								'<Query>'+
										'<Where>'+
											'<And>'+
												'<And>'+
													'<Geq><FieldRef Name=\'LSiBirthdayD\' /><Value Type=\'Number\'>'+ startOfWeek.date() +'</Value></Geq>'+
													'<Geq><FieldRef Name=\'LSiBirthdayM\' /><Value Type=\'Number\'>'+ (startOfWeek.month() + 1) +'</Value></Geq>'+
												'</And>'+
												'<And>'+
													'<Leq><FieldRef Name=\'LSiBirthdayD\' /><Value Type=\'Number\'>'+ endOfWeek.date() +'</Value></Leq>'+
													'<Leq><FieldRef Name=\'LSiBirthdayM\' /><Value Type=\'Number\'>'+ (endOfWeek.month() + 1)+'</Value></Leq>'+
												'</And>'+
											'</And>'+
										'</Where>'+
								'</Query>' +
							'</View>'
				:
					'<View>'+
								'<Query>'+
										'<Where>'+
											'<Or>'+
												'<And>'+
													'<Geq><FieldRef Name=\'LSiBirthdayD\' /><Value Type=\'Number\'>' + startOfWeek.date() + '</Value></Geq>'+
													'<Eq><FieldRef Name=\'LSiBirthdayM\' /><Value Type=\'Number\'>'+ (startOfWeek.month() + 1) +'</Value></Eq>'+
												'</And>'+
												'<And>'+
													'<Leq><FieldRef Name=\'LSiBirthdayD\' /><Value Type=\'Number\'>'+ endOfWeek.date() +'</Value></Leq>'+
													'<Eq><FieldRef Name=\'LSiBirthdayM\' /><Value Type=\'Number\'>'+ (endOfWeek.month() + 1) +'</Value></Eq>'+
												'</And>'+
											'</Or>'+
										'</Where>'+
								'</Query>' +
							'</View>';

    this.getBirthUsers(target).then(users=>{
      this.weekArr = users;
    })
  }

  public getMonth() : void {
    let target = '<View>'+
						'<Query>'+
								'<Where>'+
									`<Eq><FieldRef Name=\'LSiBirthdayM\' /><Value Type=\'Number\'>${(moment().month() + 1)}</Value></Eq>`+
								'</Where>'+
						'</Query>' +
	    			'</View>';

    this.getBirthUsers(target).then(users=>{
      this.monthArr = users;
    })
  }
  
  public openCard(user) : void {//
    let greeting_guid = JSON.parse(window.localStorage.getItem('lsi'))['LSiBirthdayGreetingsList'];
    this.navCtrl.push(GreetingCard,{
        greeting_user : user,
        guid : greeting_guid
      });
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

  // public checkNewUser(user,segment) : void {
  //   // let temp;
  //   // switch(segment){
  //   //   case 'today':
  //   //     temp = this.todayArr[0];
  //   //     this.todayArr[this.todayArr.indexOf(user)] = temp;
  //   //     this.todayArr[0] = user;
  //   //     break;
  //   //   case 'tomorrow':
  //   //     temp = this.tomorrowArr[0];
  //   //     this.tomorrowArr[this.tomorrowArr.indexOf(user)] = temp;
  //   //     this.tomorrowArr[0] = user;
  //   //     break;
  //   //   case 'week':
  //   //     temp = this.weekArr[0];
  //   //     this.weekArr[this.weekArr.indexOf(user)] = temp;
  //   //     this.weekArr[0] = user;
  //   //     break;
  //   //   case 'month':
  //   //     temp = this.monthArr[0];
  //   //     this.monthArr[this.monthArr.indexOf(user)] = temp;
  //   //     this.monthArr[0] = user;
  //   //     break;
  //   //   default :
  //   //     console.log('<Birth> check user: segment not detected:',{segment:segment,user:user});
  //   // }
  // }
