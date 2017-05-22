import { Component, Inject, ViewChild } from '@angular/core';
import { NavController, NavParams, Events, Content, ToastController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as moment from 'moment';
import * as consts from '../../../utils/consts';
import { Localization } from '../../../utils/localization';
import { Images } from '../../../utils/images';
import { User } from '../../../utils/user';
import { Access } from '../../../utils/access';

import * as jwt from 'jwt-decode';

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

  constructor(public navCtrl: NavController,public events : Events, @Inject(User) public user : User, @Inject(Access) public access : Access, public navParams: NavParams,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization,public http : Http,private toastCtrl: ToastController) {
    this.card = navParams.data.item;
    this.getCommentsUsers();
    this.showComments = navParams.data.comments;
    this.guid = navParams.data.guid;

    access.getDigestValue().then(digest => this.digest = digest);
    access.getToken().then(token => this.access_token = token);
  }

  ionViewDidEnter(){
    this.showComments ? this.focuse('comments'): null;
  }

  public newsLiked(item): Promise<any>{
    let urlAuth = `https://lizardsoftdev.sharepoint.com/_layouts/15/appredirect.aspx?client_id=042a3cb4-c140-4455-ab2f-e46f149311dc&redirect_uri=https://lsdocs.azurewebsites.net`;

    let headers = new Headers({'Accept': 'application/json;odata=verbose'});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(urlAuth,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
    .then(data=>{
      let text = data.text();
      let tokeninput = text.substring(text.indexOf('name="SPAppToken"'),text.length);
      let token = tokeninput.substring(tokeninput.indexOf(`value="`)+`value="`.length,tokeninput.indexOf('" />'));

      return jwt(token).refreshtoken;
    })
    .then(r_token=>{
      let url = `https://accounts.accesscontrol.windows.net/${consts.site_realm}/tokens/OAuth/2`;

      let body = `grant_type=refresh_token&
            client_id=${consts.client_id}@${consts.site_realm}&
            client_secret=${encodeURIComponent(consts.secret)}&
            resource=${consts.resource}/${consts.siteUrl.substring('https://'.length,consts.siteUrl.indexOf('/sites'))}@${consts.site_realm}&
            refresh_token=${r_token}`

      let headers = new Headers({'Accept': 'application/json;odata=verbose','Content-Type':'application/x-www-form-urlencoded'});
      let options = new RequestOptions({ headers: headers ,withCredentials: true});

      return this.http.post(url,body,options).timeout(consts.timeoutDelay+1000).retry(consts.retryCount+3).toPromise();
    })
    .then(response=>{
      console.log('response: ',response.json().access_token);
    })
    .catch(error=>{console.log('error:',error)})



  }

  // public newsLiked(item) : Promise<any> {
  //   item.liked = item.liked? false : true;
  //   item.liked?item.LikesCount++ : item.LikesCount--;
  //   item.liked?item.LikedByStringId.results.push(this.user.getId().toString()) : item.LikedByStringId.results.pop();

  //   let url = `${consts.siteUrl}/_api/Web/Lists('${this.guid}')/Items(${this.card.Id})`;
  //   let body = {
  //       "__metadata": {
  //         type : 'SP.Data.PagesItem'
  //       },
  //       LikesCount : item.LikesCount,
  //       LikedByStringId : item.LikedByStringId
  //   }
  //   let headers = new Headers({"Authorization":(consts.OnPremise? `Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}` : `Bearer ${this.access_token}`),"X-RequestDigest":this.digest, "X-HTTP-Method":"MERGE","IF-MATCH": "*",'Accept': 'application/json;odata=verbose',"Content-Type": "application/json;odata=verbose"});
  //   let options = new RequestOptions({ headers: headers });

  //   return this.http.post(url,JSON.stringify(body),options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
  //     .then((data)=>{
  //       console.log('liked data:',data.json());
  //     })
  //     .catch(error=>{
  //       console.error('<Card> Add Like error:',error);
  //       //this.showToast(this.loc.dic.mobile.OperationError+'. '+this.loc.dic.NotifField_TaskComment+' '+this.loc.dic.mobile.unsaved);
  //     })
  // }

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
    let options = new RequestOptions({ headers: headers });

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
      item.MyCreated = moment(item.Created).fromNow();//(new Date(item.Created)).toLocaleString();
      let url = `${consts.siteUrl}/_api/Web/GetUserByid(${item.AuthorId})?$select=Title,Email`;

      let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
      let options = new RequestOptions({ headers: headers ,withCredentials: true});

      this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
        .then(res=>{
          item.user = res.json().d;
        })
        .catch(error=>{
          console.error('<Card> Get Comments Users error:',error);
        })
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
