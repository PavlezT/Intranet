import { Component, Inject } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as moment from 'moment';
import * as consts from '../../../utils/consts';
import { Localization } from '../../../utils/localization';
import { Access } from '../../../utils/access';
import { Images } from '../../../utils/images';
import { User } from '../../../utils/user';

@Component({
  selector: 'greeting_card',
  templateUrl: 'greeting_card.html',
})
export class GreetingCard {

  title: string;
  guid:string;
  birth: any;
  access_token : string;
  digest : string;

  todayArr : any;
  tomorrowArr : any;
  weekArr : any;
  monthArr : any;

  constructor(public navCtrl: NavController, public navParams: NavParams,public modalCtrl: ModalController,@Inject(Access) public access : Access,@Inject(User) public user : User,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization,public http : Http) {
    this.title = navParams.data.title || loc.dic.modules.News;
    this.guid = navParams.data.guid;
    this.birth = 'today';

    Promise.all([access.getToken().then(token => this.access_token = token),access.getDigestValue().then(digest => this.digest = digest)])
      .then(()=>{
        this.getToday();
      })    
  }

  private getBirthUsers(target : string) : Promise<any> {
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/GetItems(Query=@target)?$select=UserEmail,Title,Id,JobTitle&$top=50&@target={"ViewXml":"${target}"}`;

    let headers = new Headers({"Authorization":(consts.OnPremise?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'Accept': 'application/json;odata=verbose'});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.post(url,{},options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(response=>{
        return response.json().d.results;
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

  public checkNewUser(user,segment) : void {
    let temp;
    switch(segment){
      case 'today':
        temp = this.todayArr[0];
        this.todayArr[this.todayArr.indexOf(user)] = temp;
        this.todayArr[0] = user;
        break;
      case 'tomorrow':
        temp = this.tomorrowArr[0];
        this.tomorrowArr[this.tomorrowArr.indexOf(user)] = temp;
        this.tomorrowArr[0] = user;
        break;
      case 'week':
        temp = this.weekArr[0];
        this.weekArr[this.weekArr.indexOf(user)] = temp;
        this.weekArr[0] = user;
        break;
      case 'month':
        temp = this.monthArr[0];
        this.monthArr[this.monthArr.indexOf(user)] = temp;
        this.monthArr[0] = user;
        break;
      default :
        console.log('<Birth> check user: segment not detected:',{segment:segment,user:user});
    }
  }
  
  public openGreetindCard(user) : void {
    // this.modalCtrl.create(GreetindCard,{
    //     greeting_user : user
    //   }).present()
  }

}
