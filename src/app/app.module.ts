import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { HttpModule } from '@angular/http';

import { MyApp } from './app.component';
import { News } from '../pages/news/news';
import { Card } from '../pages/news/card/card';
import { IdeaBox } from '../pages/idea/idea';
import { OrgStructure } from '../pages/org-structure/org-structure';
import { DepartmentUsers } from '../pages/org-structure/department_users/department_users';
import { Birthdays } from '../pages/birthdays/birthdays';
import { GreetingCard } from '../pages/birthdays/greeting_card/greeting_card';
import { LSEvents } from '../pages/events/events';
import { Blogs } from '../pages/blogs/blogs';
import { Post } from '../pages/blogs/post/post';
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
import { FileOpener } from '@ionic-native/file-opener';
import { CallNumber } from '@ionic-native/call-number';

@NgModule({
  declarations: [
    MyApp,
    News,IdeaBox,OrgStructure,Birthdays,LSEvents,Blogs,Newcomers,Survey,Policies,
    Card,GreetingCard,DepartmentUsers,Post
  ],
  imports: [
    BrowserModule,HttpModule,
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    News,IdeaBox,OrgStructure,Birthdays,LSEvents,Blogs,Newcomers,Survey,Policies,
    Card,GreetingCard,DepartmentUsers,Post
  ],
  providers: [
    StatusBar,FileOpener,CallNumber,
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
