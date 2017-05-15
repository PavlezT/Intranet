import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { HttpModule } from '@angular/http';

import { MyApp } from './app.component';
import { News } from '../pages/news/news';
import { IdeaBox } from '../pages/idea/idea';
import { OrgStructure } from '../pages/org-structure/org-structure';
import { Birthdays } from '../pages/birthdays/birthdays';
import { LSEvents } from '../pages/events/events';
import { About } from '../pages/about/about';
import { Newcomers } from '../pages/newcomers/newcomers';
import { Survey } from '../pages/survey/survey';
import { Policies } from '../pages/policies/policies';

import { Localization } from '../utils/localization';
import { User } from '../utils/user';
import { Auth } from '../utils/auth';
import { Loader } from '../utils/loader';
import { Access } from '../utils/access';
import { Images } from '../utils/images';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Network } from '@ionic-native/network';
import { NativeStorage } from '@ionic-native/native-storage';
import { File } from '@ionic-native/file';
import { Device } from '@ionic-native/device';
import { Transfer } from '@ionic-native/transfer';

@NgModule({
  declarations: [
    MyApp,
    News,IdeaBox,OrgStructure,Birthdays,LSEvents,About,Newcomers,Survey,Policies
  ],
  imports: [
    BrowserModule,HttpModule,
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    News,IdeaBox,OrgStructure,Birthdays,LSEvents,About,Newcomers,Survey,Policies
  ],
  providers: [
    StatusBar,
    SplashScreen,Network,NativeStorage,File,Device,Transfer,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {provide: Localization, useClass: Localization},
    {provide: User, useClass: User},
    {provide: Auth, useClass: Auth},
    {provide: Loader, useClass: Loader},
    {provide: Access, useClass: Access},
    {provide: Images, useClass: Images}
  ]
})
export class AppModule {}
