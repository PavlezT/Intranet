import { Component, ViewChild, Inject } from '@angular/core';
import { Nav, Platform,AlertController,ToastController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Network } from '@ionic-native/network';

import * as consts from '../utils/consts';
import { Localization } from '../utils/localization';
import { Auth } from '../utils/auth';

import { HomePage } from '../pages/home/home';
import { ListPage } from '../pages/list/list';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;

  pages: Array<{title: string, component: any}>;

  constructor(public platform: Platform, public statusBar: StatusBar,public auth : Auth, @Inject(Localization) public loc : Localization, public splashScreen: SplashScreen,private network: Network,private alertCtrl: AlertController,private toastCtrl: ToastController) {
    this.initializeApp();

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Home', component: HomePage },
      { title: 'My List', component: ListPage }
    ];

  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      
      // this.network.onConnect().subscribe(()=>{
      //   console.log('connected to internet');
      //   this.initializeApp();
      // });

      this.checkNetwork().then(()=>{
        //this.loaderctrl.stopLoading();
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

  private startApp() : Promise<any>{
    return Promise.all([]);
  }

  private reLogin(manual?:boolean): void {
    console.log('reLogin')
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
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
            //this.getLogin(data.Email,data.Password);
          }
        }
      ]
    });
    prompt.present();
    prompt.onDidDismiss((event) => { });
  }

  private showToast(message: any){
      let toast = this.toastCtrl.create({
        message: (typeof message == 'string' )? message : message.toString().substring(0,( message.toString().indexOf('&#x') || message.toString().length)) ,
        position: 'bottom',
        showCloseButton : true,
        duration: 9000
      });
      toast.present();
  }

}
