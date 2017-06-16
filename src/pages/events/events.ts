import { Component, Inject } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as moment from 'moment';
import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';

import { spEventsParser } from './sp-events-parser';

@Component({
  selector: 'page-events',
  templateUrl: 'events.html',
})
export class LSEvents {
  
  guid:string;
  calendar : any;
  parser : spEventsParser;
  MonthEvents : any;
  WeekEvents : any;
  DayEvents : any;
  dayDate : moment.Moment;
  weekDate : moment.Moment;
  monthDate : moment.Moment;
  
  constructor(public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization,public http : Http) {
    this.guid = navParams.data.guid;
    this.calendar = 'today';
    this.parser = new spEventsParser();

    moment.locale(this.loc.localization);
    
    this.dayDate = moment().startOf('day');//.set({'hours': 0, 'minutes': 0});
    this.monthDate = moment().startOf('month');//.set({'days':0,'hours': 0, 'minutes': 0});
    this.weekDate = moment().startOf('week');//.set({'hours': 0, 'minutes': 0})

    this.getToday();
  }

  public clickLeft() : void {
    switch(this.calendar) {
      case "today":
        this.dayDate.subtract(1, 'd');
        this.DayEvents = null;
        this.getToday();
        break;
      case "week":
        this.weekDate.subtract(1,'w');
        this.WeekEvents = null;
        this.getWeek();
        break;
      case "month":
        this.monthDate.subtract(1,'M');
        this.MonthEvents = null;
        this.getMonth();
        break;
      default:
        console.log('<Events> clickLeft: this.calendar innown calendar value!')
    }
  }

  public clickRight() : void {
     switch(this.calendar) {
      case "today":
        this.dayDate.add(1, 'd');
        this.DayEvents = null;
        this.getToday();
        break;
      case "week":
        this.weekDate.add(1,'w');
        this.WeekEvents = null;
        this.getWeek();
        break;
      case "month":
        this.monthDate.add(1,'M');
        this.MonthEvents = null;
        this.getMonth();
        break;
      default:
        console.log('<Events> clickLeft: this.calendar innown calendar value!')
    }
  }

  public getToday() : void {
    let periodStart = this.dayDate.toISOString();
    let periodEnd = moment(this.dayDate.toJSON()).add(1,'d').toISOString();
      
    this.getEvents(periodStart,periodEnd).then(data=>{
      this.DayEvents = data.filter(item=>{
        item.date = ( item.date != moment(periodStart).date() ? moment(periodStart).date() : item.date );
        if(item.fAllDayEvent){
          return (moment(item.EventDate).date() < moment(periodStart).date() ? null : item );
        }
        return item;
      })
    })
  }

  public getWeek() : void { 
    let periodStart = this.weekDate.toJSON();
    let periodEnd = moment(this.weekDate.toJSON()).add(1,'w').toJSON();

    this.getEvents(periodStart,periodEnd).then(data=>{
      this.WeekEvents = data;
    }) 
  }

  public getMonth() : void {
    let periodStart = this.monthDate.toJSON();
    let periodEnd = moment(this.monthDate.toJSON()).add(1,'M').toJSON();

    this.getEvents(periodStart,periodEnd).then(data=>{
      this.MonthEvents = data;
    })
  }

  private getEvents(periodStart : string,periodEnd : string) : Promise<any> {
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/items?$select=EventDate,EndDate,Duration,fAllDayEvent,Title,Location,fRecurrence,Description,Id,RecurrenceID,RecurrenceData`
    +`&$expand=FieldValuesAsText/RecurrenceID,FieldValuesAsText/RecurrenceData`
    // +`&$filter=((EventDate+ge+datetime'${periodStart}') and (EndDate+le+datetime'${periodEnd}'))`
    // +` or ((fAllDayEvent+eq+1) and (EventDate+ge+'${moment(periodStart).minutes(moment(periodStart).utcOffset()).toJSON()}') and (EndDate+le+'${moment(periodStart).minutes(moment(periodStart).utcOffset()).add(1,'d').toJSON()}'))`
    // +` or (fRecurrence+eq+1)`;
    +`&$filter=((EventDate+ge+datetime'${periodStart}') and (EventDate+lt+datetime'${periodEnd}'))`
    +` or ((EndDate+gt+datetime'${periodStart}') and (EndDate+le+datetime'${periodEnd}'))`
    +` or ((EventDate+le+datetime'${periodStart}') and (EndDate+ge+datetime'${periodEnd}'))`;

    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        return this.parser.parseEvents(res.json().d.results,new Date(periodStart), new Date(periodEnd)).map(item=>{
          item.month = moment(item.EventDate).format('MMM');
          item.date = moment(item.EventDate).date();
          return item;
        }).sort((a,b)=>{ return (a.date > b.date ? 1 : -1) });
      })
      .catch(error=>{
        console.log('<Events> getEvents error:',error);
        return [];
      })
  }

}
