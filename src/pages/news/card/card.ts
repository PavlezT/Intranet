import { Component, Inject, ViewChild } from '@angular/core';
import { NavController, NavParams, Events, Content } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as consts from '../../../utils/consts';
import { Localization } from '../../../utils/localization';
import { Images } from '../../../utils/images';
import { User } from '../../../utils/user';
declare var cordova:any;
@Component({
  selector: 'page-card',
  templateUrl: 'card.html',
})
export class Card {
  
  @ViewChild('comments') commentsView: any;
  @ViewChild('textcomment') textcomment : any;
  @ViewChild(Content) content: Content;

  card : any;
  showComments : boolean;

  constructor(public navCtrl: NavController,public events : Events, @Inject(User) public user : User, public navParams: NavParams,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization,public http : Http) {
    this.card = navParams.data.item;
    this.getCommentsUsers();
    this.showComments = navParams.data.comments;
  }

  ionViewDidEnter(){
    this.showComments ? this.focuse('comments'): null;
  }

  public newsLiked(item) : void {
    console.log('news liked:',item);
    item.liked = item.liked? false : true;
    item.liked?item.LikesCount++ : item.LikesCount--;
    // there is needed POST 
  }

  public sendComment(){
    console.log('comment:',this.textcomment.value)
  }

  public focuse(target){
    if(target == 'comments'){
      this.content.scrollTo(0,this.commentsView.nativeElement.offsetTop,1000);
    } else if(target == 'textcomment'){
      this.textcomment.setFocus();
      setTimeout(()=>{this.content.scrollToBottom(800)},450);
    } else if(target == 'textcomment2'){
      setTimeout(()=>{this.content.scrollTo(0,this.content.scrollHeight-this.content._scrollPadding+this.content.contentTop)},450);
    }
  }

  private getCommentsUsers() : void {
    this.card.MyComments.map(item=>{
      let url = `${consts.siteUrl}/_api/Web/GetUserByid(${item.AuthorId})?$select=Title,Email`;

      let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
      let options = new RequestOptions({ headers: headers ,withCredentials: true});

      this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
        .then(res=>{
          item.user = res.json().d;
        })
    })
  }

}
