import { Component, Inject } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
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

  constructor(public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization,@Inject(Access) public access : Access,@Inject(Images) public images: Images,public http : Http) {
    // this.title = navParams.data.title || loc.dic.modules.News;//New Employees
    this.guid = navParams.data.guid;
    this.newcomers = 'today';

    Promise.all([access.getToken().then(token => this.access_token = token),access.getDigestValue().then(digest => this.digest = digest)])
      .then(()=>{
        moment.locale(this.loc.localization);
        this.getToday();
      }) 
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

    let headers = new Headers({"Authorization":(consts.OnPremise?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'Accept': 'application/json;odata=verbose',"Content-Type": "application/json;odata=verbose"});
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

}
