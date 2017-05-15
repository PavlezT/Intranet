import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { HttpModule } from '@angular/http';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { ListPage } from '../pages/list/list';

import { Localization } from '../utils/localization';
import { User } from '../utils/user';
import { Auth } from '../utils/auth';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Network } from '@ionic-native/network';
import { NativeStorage } from '@ionic-native/native-storage';
import { File } from '@ionic-native/file';
import { Device } from '@ionic-native/device';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    ListPage
  ],
  imports: [
    BrowserModule,HttpModule,
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    ListPage
  ],
  providers: [
    StatusBar,
    SplashScreen,Network,NativeStorage,File,Device,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {provide: Localization, useClass: Localization},
    {provide: User, useClass: User},
    {provide: Auth, useClass: Auth}
  ]
})
export class AppModule {}
