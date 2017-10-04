import { Component, Inject, ViewChild } from '@angular/core';
import { NavController, NavParams, Platform, ToastController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as moment from 'moment';

import * as consts from '../../../utils/consts';
import { Localization } from '../../../utils/localization';

@Component({
  selector: 'page-eventview',
  templateUrl: 'eventview.html',
})
export class EventView {

    event : any;

    constructor(public platform : Platform,public navCtrl: NavController, public navParams: NavParams,private toastCtrl: ToastController, @Inject(Localization) public loc : Localization) {
        this.event = navParams.data.item;
    }

    ionViewDidEnter(){
        this.platform.registerBackButtonAction((e)=>{
          this.navCtrl.pop();
        },100);
    }

    public getStartDate() : string {
        return this.event.EventDate.toLocaleString();
    }

    public getEndDate() : string {
        return this.event.EndDate.toLocaleString();
    }

    public getLocation() : string {
        return (this.event.Location || this.loc.dic.PresentsStatus2);
    }

    public getDuration() : string {
        var toHHMMSS = (secs) => {
            var sec_num = parseInt(secs, 10)    
            var hours   = Math.floor(sec_num / 3600) % 24
            var minutes = Math.floor(sec_num / 60) % 60
            var seconds = sec_num % 60    
            return [hours,minutes,seconds]
                .map(v => v < 10 ? "0" + v : v)
                .filter((v,i) => v !== "00" || i > 0)
                .join(":")
        }
        return toHHMMSS(this.event.Duration);
    }

    private showToast(message: any){
      let toast = this.toastCtrl.create({
        message: (typeof message == 'string' )? message.substring(0,( message.indexOf('&#x') != -1? message.indexOf('&#x') : message.length)) : message.toString().substring(0,( message.toString().indexOf('&#x') != -1 ?message.toString().indexOf('&#x') : message.toString().length)) ,
        position: 'bottom',
        showCloseButton : true,
        duration: 9000
      });
      toast.present();
    }

}
  