import { Component, Inject, ViewChild } from '@angular/core';
import { NavController, NavParams, Events, Content, ToastController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as moment from 'moment';
import * as consts from '../../../utils/consts';
import { Localization } from '../../../utils/localization';
import { Images } from '../../../utils/images';
import { User } from '../../../utils/user';
import { Access } from '../../../utils/access';

@Component({
  selector: 'page-card',
  templateUrl: 'card.html',
})
export class Card {
  
  @ViewChild('comments') commentsView: any;
  @ViewChild('textcomment') textcomment : any;
  @ViewChild(Content) content: Content;

  card : any;
  guid : string;
  showComments : boolean;
  digest : string;
  access_token : string;
  newsLiked : any;
  
  constructor(public navCtrl: NavController,public events : Events, @Inject(User) public user : User, @Inject(Access) public access : Access, public navParams: NavParams,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization,public http : Http,private toastCtrl: ToastController) {
    this.card = navParams.data.item;
    this.getCommentsUsers();
    this.showComments = navParams.data.comments;
    this.guid = navParams.data.guid;
    this.newsLiked = navParams.data.newsLiked;

    access.getDigestValue().then(digest => this.digest = digest);
    access.getToken().then(token => this.access_token = token);
  }

  ionViewDidEnter(){
    this.showComments ? this.focuse('comments'): null;
  }

  public sendComment(button) : Promise<any>{
    button.target.parentNode.disabled = true;
    let url = `${consts.siteUrl}/_api/Web/Lists('${this.card.commentsListGuid}')/Items`;
    let body = {
        "__metadata": {
          type : 'SP.Data.LSiNewsCommentsListListItem'
        },
        LSiCommentText : this.textcomment.value,
        LSiCommentPageID : this.card.Id,
        "AuthorId" : this.user.getId()
    }
    let headers = new Headers({"Authorization":(consts.OnPremise?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'X-HTTP-Method':'POST','IF-MATCH': '*','Accept': 'application/json;odata=verbose',"Content-Type": "application/json;odata=verbose"});
    let options = new RequestOptions({ headers: headers,withCredentials: true });

    return this.http.post(url,JSON.stringify(body),options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then((data)=>{
        button.target.parentNode.disabled = false;
        this.textcomment.clearTextInput();
        
        let comment = data.json().d;
        comment.FieldValuesAsText.LSiCommentText = comment.LSiCommentText,
        comment.MyCreated = moment(comment.Created).fromNow();
        comment.user = this.user.user;
        this.card.MyComments.push(comment);
      })
      .catch(error=>{
        button.target.parentNode.disabled = false;
        console.error('<Card> Send Comment error:',error);
        this.showToast(this.loc.dic.mobile.OperationError+'. '+this.loc.dic.NotifField_TaskComment+' '+this.loc.dic.mobile.unsaved);
      })
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
      item.MyCreated = moment(item.Created).fromNow();
      // let url = `${consts.siteUrl}/_api/Web/GetUserByid(${item.AuthorId})?$select=Title,Email`;

      // let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
      // let options = new RequestOptions({ headers: headers ,withCredentials: true});

      // this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      //   .then(res=>{
      //     item.user = res.json().d;
      //   })
      //   .catch(error=>{
      //     console.error('<Card> Get Comments Users error:',error);
      //   })
    })
  }

  private showToast(message: any){
      let toast = this.toastCtrl.create({
        message: (typeof message == 'string' )? message.substring(0,( message.indexOf('&#x') != -1? message.indexOf('&#x') : message.length)) : message.toString().substring(0,( message.toString().indexOf('&#x') != -1 ?message.toString().indexOf('&#x') : message.toString().length)) ,
        position: 'bottom',
        showCloseButton : true,
        duration: 9000
      });
      toast.present();
  }

}
