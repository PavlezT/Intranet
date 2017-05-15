import { Component, Inject } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { Localization } from '../../utils/localization';

@Component({
  selector: 'page-idea',
  templateUrl: 'idea.html',
})
export class IdeaBox {

  title: string;
  guid: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization) {
    this.title = navParams.data.title || loc.dic.modules.IdeaBox;
    this.guid = navParams.data.guid;
  }

}
