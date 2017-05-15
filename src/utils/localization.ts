import { Injectable , Inject } from '@angular/core';
import { Platform,Events } from 'ionic-angular';
import { User } from './user';

import * as transru from '../assets/i18n/ru';
import * as transus from '../assets/i18n/us';
import * as transua from '../assets/i18n/ua';

@Injectable()
export class Localization {

    localization : string ;
    dic : any;

    constructor(@Inject(User) public user : User,public events: Events ,public plat : Platform){ 
        this.localization = 'ru';
        this.loadDictionary();
        events.subscribe('user:loaded',()=>{
                this.localization = this.transformLocale(this.user.locale);
                this.loadDictionary();
        });
        this.plat.ready().then(()=>{
            this.user.getUserProps().then(()=>{
                this.localization = this.transformLocale(this.user.locale);
                this.loadDictionary();
            })
        })
        
    }

    private loadDictionary() : void {
        switch(this.localization){
            case 'ru':
                this.dic = transru;
                break;
            case 'uk':
                this.dic = transua;
                break;
            case 'en-gb':
                this.dic = transus;
                break;
            default :
                this.dic = transru;
        }
    }

    private transformLocale(locale : string) : string{
        switch(locale){
            case 'us':
                return 'en-gb';
            case 'ua':
                return 'uk';
            default:
                return locale;
        }
    }

}