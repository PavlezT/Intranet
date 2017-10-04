import { Component, Inject, ViewChild } from '@angular/core';
import { NavController, NavParams, Platform, Content, ToastController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as consts from '../../../utils/consts';
import { Localization } from '../../../utils/localization';
import { Access } from '../../../utils/access';
import { Images } from '../../../utils/images';
import { User } from '../../../utils/user';

@Component({
  selector: 'greeting_card',
  templateUrl: 'greeting_card.html',
})
export class GreetingCard {

  @ViewChild('textcomment') textcomment : any;
  @ViewChild(Content) content: Content;

  greeting_user: any;
  guid:string;
  Comments : any;

  access_token : string;
  digest : string;

  constructor(public platform : Platform,public navCtrl: NavController, public navParams: NavParams,@Inject(Access) public access : Access,@Inject(User) public user : User,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization,public http : Http, private toastCtrl: ToastController) {
    this.greeting_user = navParams.data.greeting_user;
    this.guid = navParams.data.guid;
    this.Comments = [];
    
    access.getToken().then(token => this.access_token = token);
    access.getDigestValue().then(digest => this.digest = digest);
    this.getGreetings().then(data=>{this.Comments = data});
  }

  ionViewDidEnter(){
    this.platform.registerBackButtonAction((e)=>{
      this.navCtrl.pop();
  },100);
}

  private getGreetings() : Promise<any> {
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/items?$select=LSiBirthdayGreetingsText,LSiBirthdayPersonId,Id,Modified,Author/Id,Author/Title,Author/EMail&$expand=Author/Id&$filter=LSiBirthdayPersonId+eq+${this.greeting_user.User1Id}`;
    
    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        return res.json().d.results.map(item=>{
          item.MyDate = (new Date(item.Modified)).toLocaleDateString();
          return item;
        })
      })
      .catch(error=>{
        console.log('<Greeting Card> getGreetings error: ',error);
        return [];
      })
  }

  public sendComment(button) : Promise<any> {
    if(!(this.textcomment.value.length > 0))return Promise.resolve();
    button.target.parentNode.disabled = true;
    let url = `${consts.siteUrl}/_api/Web/Lists('${this.guid}')/Items`;
    let body = {
        "__metadata": {
          type : 'SP.Data.LSiBirthdayGreetingsListListItem'
        },
        LSiBirthdayGreetingsText : this.textcomment.value,
        LSiBirthdayPersonId : this.greeting_user.User1Id,
        LSiBirthdayPersonStringId: this.greeting_user.User1Id?this.greeting_user.User1Id.toString() : "", 
        "AuthorId" : this.user.getId()
    }
    let headers = new Headers({"Authorization":(window.localStorage.getItem('OnPremise')?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'X-HTTP-Method':'POST','IF-MATCH': '*','Accept': 'application/json;odata=verbose',"Content-Type": "application/json;odata=verbose"});
    let options = new RequestOptions({ headers: headers,withCredentials: true });

    return this.http.post(url,JSON.stringify(body),options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then((data)=>{
        button.target.parentNode.disabled = false;
        this.textcomment.clearTextInput();
        
        let comment = data.json().d;
        comment.MyDate = (new Date(comment.Modified)).toLocaleDateString();
        comment.Author = {
          Title : this.user.getUserName(),
          EMail : this.user.getEmail()
        }

        this.Comments.push(comment);
      })
      .catch(error=>{
        button.target.parentNode.disabled = false;
        console.error('<GreetingCard> Send Comment error:',error);
        this.showToast(this.loc.dic.mobile.OperationError+'. '+this.loc.dic.NotifField_TaskComment+' '+this.loc.dic.mobile.unsaved);
      })
  }

  public focuse(target) : void{
      
    //  +this.textcomment._native._elementRef.nativeElement.clientHeight
      setTimeout(()=>{
        console.log('this.textarea: ',this.textcomment)
        console.log('this.content:',this.content)
        let b = 75;//textarea height;
        this.content.scrollTo(0,this.content.scrollHeight+b-this.content._scrollPadding);
      },400);
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
