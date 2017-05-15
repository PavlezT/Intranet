import { Component, Inject } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';

@Component({
  selector: 'page-news',
  templateUrl: 'news.html',
})
export class News {
  
  title: string;
  guid:string;

  constructor(public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization) {
    this.title = navParams.data.title || loc.dic.modules.News;
    this.guid = navParams.data.guid;

    this.getNews();
  }

  private getNews() : void {
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/items?$select=*,FieldValuesAsHtml&$filter=ContentTypeId+eq+'0x010100C568DB52D9D0A14D9B2FDCC96666E9F2007948130EC3DB064584E219954237AF3900095501B5B63545D194FFAEC2FB04E8BE003EA2580BDE77674389AAFD682595246C'это первоначальный доступ к новостям.`
  }

}
