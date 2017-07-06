import { Component, Inject } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';

@Component({
  selector: 'page-blogs',
  templateUrl: 'blogs.html',
})
export class Blogs {
  
  title: string;
  guid:string;

  Blogs : any;
  
  constructor(public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization) {
    this.title = navParams.data.title;
    this.guid = navParams.data.guid;

    this.Blogs = [{Author:{Title:'A1',EMail:'a1@lizrd.vom'},Body:'body1',Title:'title1',Created: (new Date()),LikesCount:2,LikedByStringId:{results:['11','12']}},{Author:{Title:'A1',EMail:'a1@lizrd.vom'},Body:'body1',Title:'title1',Created: (new Date()),LikesCount:2,LikedByStringId:{results:['11','12']}},{Author:{Title:'A1',EMail:'a1@lizrd.vom'},Body:'body1',Title:'title1',Created: (new Date()),LikesCount:2,LikedByStringId:{results:['11','12']}}]
    this.getBlogs();
  }

  private getBlogs() : Promise<any> {
    return Promise.resolve();
  }

  public getComments(blog) : Promise<any> {
    return Promise.resolve();
  }

}
