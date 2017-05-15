import { Component, ViewChild, Inject } from '@angular/core';
import { Nav, Platform, AlertController, ToastController, Events } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Network } from '@ionic-native/network';
import { NativeStorage } from '@ionic-native/native-storage';

import * as consts from '../utils/consts';
import { Localization } from '../utils/localization';
import { Auth } from '../utils/auth';
import { Loader } from '../utils/loader';
import { User } from '../utils/user';
import { Images } from '../utils/images';
import { Access } from '../utils/access';

import { News } from '../pages/news/news';
import { IdeaBox } from '../pages/idea/idea';
import { OrgStructure } from '../pages/org-structure/org-structure';
import { Birthdays } from '../pages/birthdays/birthdays';
import { LSEvents } from '../pages/events/events';
import { About } from '../pages/about/about';
import { Newcomers } from '../pages/newcomers/newcomers';
import { Survey } from '../pages/survey/survey';
import { Policies } from '../pages/policies/policies';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = News;

  pages: Array<{lsiName:string,title: string, component: any, guid: string}>;
  errorCounter: number;

  constructor(public platform: Platform, public statusBar: StatusBar,public auth : Auth,public http : Http, @Inject(Localization) public loc : Localization, public events: Events, @Inject(User) public user : User, @Inject(Access) public access : Access, @Inject(Images) public images: Images, public nativeStorage: NativeStorage, @Inject(Loader) public loaderctrl: Loader, public splashScreen: SplashScreen,private network: Network,private alertCtrl: AlertController,private toastCtrl: ToastController) {
    this.initializeApp();

    this.errorCounter = 0;
    this.pages = [
      { lsiName: 'Pages',title: loc.dic.modules.News, component: News, guid:'1' },
      { lsiName: 'LSiIdeaBank',title: loc.dic.modules.IdeaBox, component: IdeaBox, guid : '1'},
      { lsiName: 'LSiDepartments',title: loc.dic.modules.OrgStructure , component: OrgStructure , guid : '1'}, 
      { lsiName: 'LSiBirthdayGreetingsList',title: loc.dic.modules.Birthdays , component: Birthdays , guid : '1'},
      { lsiName: 'LSiCalendar',title: loc.dic.modules.Events , component: LSEvents , guid : '1'},
      { lsiName: 'SitePages',title: loc.dic.modules.About , component: About , guid : '1'},
      { lsiName: 'LSiUsers',title: loc.dic.modules.Newcomers , component: Newcomers , guid : '1'},
      { lsiName: 'LSiUserKPIs',title: loc.dic.modules.Survey , component: Survey , guid : '1'},
      { lsiName: 'LSiPolicie',title: loc.dic.modules.Policies , component: Policies , guid : '1'},
    ];

  }

  ionViewDidEnter(){
    this.platform.registerBackButtonAction((e)=>{this.platform.exitApp();return false;},100);
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.loaderctrl.presentLoading();
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      
      // this.network.onConnect().subscribe(()=>{
      //   console.log('connected to internet');
      //   this.initializeApp();
      // });

      this.checkNetwork().then(()=>{
        this.loaderctrl.stopLoading();
        if(!(this.auth.checkAuthAlready(consts.siteUrl))){
            this.showPrompt();
         } else if(!(this.auth.checkAuthActive(consts.siteUrl))){
            this.reLogin();
         } else {
            this.startApp();
         }
      })
      .catch((reason : string)=>{
         this.showToast(reason);
      })

    });
  }

  checkNetwork() : Promise<any>{
    if(this.network.type != 'none'){
      return Promise.resolve();
    }
    return Promise.reject('<App> There is no internet connection');
  }

  private startApp() : Promise<any> {
    this.loaderctrl.presentLoading();
    return Promise.all([this.getLists(),this.user.init()])
      .then( res => {
            this.events.publish('user:loaded');
            this.access._init();
            this.images._init();
            this.pages[1].component
            this.pages=this.pages.filter((page,i,pages)=>{
              page.title=this.loc.dic.modules[page.component.name];
              return (res[0][page.lsiName]) ? (page.guid = res[0][page.lsiName]) : null;              
            })
            
            this.loaderctrl.stopLoading();
      })
      .catch( error => {
          console.log(`<App> Error in making Burger Menu`,error);
          if(this.errorCounter <= 1 && error.status == '403'){
              this.errorCounter++;
              this.loaderctrl.stopLoading();
              this.reLogin();
          } else if((this.errorCounter <= 1 && error.status == '401') || (this.errorCounter > 1 && error.status == '403')){
              this.errorCounter++;
              this.showPrompt();
              this.loaderctrl.stopLoading();
              this.showToast('Check your credentials');
          } else {
              this.showToast('Can`t load entrance data');
          }
      })
  }

  getLogin(userName : string , userPassword : string) : void {
     this.loaderctrl.presentLoading();
     this.auth.init(consts.siteUrl,{username : userName, password : userPassword});
     this.auth.getAuth().then(
        result => {
           this.loaderctrl.stopLoading();
           this.startApp();
        },
        errorMessage => {
           this.showPrompt();
           this.showToast(errorMessage.message?errorMessage.message : errorMessage);
           this.loaderctrl.stopLoading();
        })
  }

  private reLogin(manual?:boolean): void {
    this.loaderctrl.presentLoading();
    if(manual){
      this.nativeStorage.remove('user');
      window.localStorage.removeItem(consts.siteUrl.substring(0,consts.siteUrl.indexOf('/sites/')));
    }
    (manual ? Promise.reject('relogin user') : this.nativeStorage.getItem('user'))
     .then(
       user => {
          this.loaderctrl.stopLoading();
          this.getLogin(user.username, user.password);
       },
       error => {
          !manual && console.error('#Native storage: ',error);
          this.loaderctrl.stopLoading();
          !manual && this.showToast(`Can't load user credentials`);
          this.showPrompt();
       }
     )
  }

  private getLists() : Promise<any> {
    let url = `${consts.siteUrl}/_catalogs/masterpage/lsintranet/js/lsi.listscollection.js`;

    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).toPromise()//.retry(consts.retryCount)
      .then( response =>{
        let text = response.text();
        text = text.replace(/\'/g,`"`).replace(/;/g,'');
        let lsi = (text.substring(text.indexOf('LSi.ListsCollection = ')+'LSi.ListsCollection = '.length,text.length));
        window.localStorage.setItem('lsi',lsi);
        return JSON.parse(lsi);
      })
      .catch(error=>{
        throw new Object(error);
      })
  }

  openPage(page) {
    this.nav.setRoot(page.component,{title : page.title , guid : page.guid });
  }

  public userTapped() : void {
    let prompt = this.alertCtrl.create({
      title: this.loc.dic.mobile.ChangeUser+"?",//'Вийти',
      message: this.loc.dic.mobile.ChangeUser +this.loc.dic.mobile.and+this.loc.dic.mobile.enterAnotherUser ,//"Вийти із даного облікового запису і зайти під іншим",
      enableBackdropDismiss: true,
      buttons: [
        {
          text: this.loc.dic.Cencel,
          handler: data => {
            //prompt.dismiss();
          }
        },
        {
          text: this.loc.dic.Accept,
          handler: data => {
            this.reLogin(true);
          }
        }
      ]
    });
    prompt.present();
    prompt.onDidDismiss((event) => { });
  }

  private showPrompt() : void {
    this.platform.registerBackButtonAction((e)=>{return false;},100); // e.preventDefault();
    let prompt = this.alertCtrl.create({
      title: this.loc.dic.mobile.Login,
      message: this.loc.dic.mobile.EnterMessage,
      enableBackdropDismiss: false,
      inputs: [
        {
          name: 'Email',
          placeholder: 'Email'
        },
        {
          name: 'Password',
          type: 'password',
          placeholder: 'Password'
        }
      ],
      buttons: [
        {
          text: this.loc.dic.Accept,
          handler: data => {
            this.getLogin(data.Email,data.Password);
          }
        }
      ]
    });
    prompt.present();
    prompt.onDidDismiss((event) => { });
  }

  private showToast(message: any){
      let toast = this.toastCtrl.create({
        message: (typeof message == 'string' )? message.substring(0,( message.indexOf('&#x') || message.length)) : message.toString().substring(0,( message.toString().indexOf('&#x') || message.toString().length)) ,
        position: 'bottom',
        showCloseButton : true,
        duration: 9000
      });
      toast.present();
  }

}
