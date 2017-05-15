import { Component, Inject } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';

@Component({
  selector: 'page-policies',
  templateUrl: 'policies.html',
})
export class Policies {
  
  title: string;
  guid:string;

  constructor(public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization) {
    this.title = navParams.data.title || loc.dic.modules.News;
    this.guid = navParams.data.guid;
  }

}
