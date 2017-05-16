import { Component, Inject } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as consts from '../../../utils/consts';
import { Localization } from '../../../utils/localization';
import { Images } from '../../../utils/images';
import { User } from '../../../utils/user';

@Component({
  selector: 'page-card',
  templateUrl: 'card.html',
})
export class Card {
  
  card : any;

  constructor(public navCtrl: NavController,public events : Events, @Inject(User) public user : User, public navParams: NavParams,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization,public http : Http) {
    this.card = navParams.data;
  }

  public newsLiked(item) : void {
    console.log('news liked:',item);
    item.liked = item.liked? false : true;
    item.liked?item.LikesCount++ : item.LikesCount--;
  }

}
