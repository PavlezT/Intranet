import { Component, Inject } from '@angular/core';
import { NavController, NavParams, Platform, ToastController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as moment from 'moment';
import 'moment/locale/uk';
import 'moment/locale/ru';
import 'moment/locale/en-gb';

import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';
import { Images } from '../../utils/images';
import { Access } from '../../utils/access';
import { User } from '../../utils/user';

import { Post } from './post/post';

@Component({
  selector: 'page-blogs',
  templateUrl: 'blogs.html',
})
export class Blogs {
  
  title: string;
  guid:string;
  commentlist_guid : string;
  backbuttonPressed : number;

  Blogs : any;

  digest : string;
  access_token : string;
  
  constructor(public platform : Platform, public navCtrl: NavController, public navParams: NavParams,private toastCtrl: ToastController,@Inject(User) public user : User, @Inject(Access) public access : Access,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization, public http : Http) {
    this.title = navParams.data.title;
    this.guid = navParams.data.guid;
    this.backbuttonPressed = 0;
    this.commentlist_guid = JSON.parse(window.localStorage.getItem('lsi'))['LSiBlogCommentsList'];

    access.getToken().then(token => this.access_token = token);
    access.getDigestValue().then(digest => this.digest = digest);
    moment.locale(this.loc.localization);

    this.getBlogs();
  }

  ionViewDidEnter(){
    this.platform.registerBackButtonAction((e)=>{
      if(this.backbuttonPressed == 0){
        this.showToast(this.loc.dic.mobile.Exit);
        this.backbuttonPressed = 1;
      } else
        this.platform.exitApp();
      return false;
    },100);
  }
  
  private getBlogs() : Promise<any> {
    let url = `${consts.siteUrl}/_api/Web/Lists('${this.guid}')/Items?$select=Title,Id,LSiBlogCategory,Created,LikesCount,LSiNewsBody,LSiNewsShortDescription,`+
              `Author/Title,Author/JobTitle,Author/EMail,ContentType/Name,FieldValuesAsText/LSiNewsBody,FieldValuesAsText/LSiNewsShortDescription,`+
              `LikedBy/UserName,LikedBy/EMail,LikedBy/Id&$expand=Author,FieldValuesAsText,ContentType,LikedBy&$orderby=Created+desc&$top=20&$filter=ContentType+eq+'Blog Post'`
              //`'0x010100C568DB52D9D0A14D9B2FDCC96666E9F2007948130EC3DB064584E219954237AF39006B501587D2B00E41AEB6CE25B613EAC9009461EE46563236489A51CB56F4444DE3'`;//ls-intranetEU
              //`'0x010100C568DB52D9D0A14D9B2FDCC96666E9F2007948130EC3DB064584E219954237AF39006B501587D2B00E41AEB6CE25B613EAC9004B61128CCCEC874B87E3A9CBA486DE54'` //lsintranet365

    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        this.Blogs = res.json().d.results.map(post=>{
          post.MyCreated = (new Date(post.Created)).toLocaleDateString();
          post.liked = post.LikedBy && post.LikedBy.results && post.LikedBy.results.find((liked_user)=>{return liked_user.Id == this.user.getId()}) ? true : false;
          post.MyComments = [];
          this.getComments(post);
          return post;
        })
      })
      .catch(error=>{
        console.log('<Blogs> get departments error:',error);
        //return this.getBlogs();
        this.Blogs = [];
      })
  }

  private getComments(blog) : Promise<any> {
    let url = `${consts.siteUrl}/_api/web/lists('${this.commentlist_guid}')/Items?$select=Title,LSiCommentText,Created,Id,LSiCommentPageID,FieldValuesAsText/LSiCommentText,Author/Title,Author/EMail&$expand=Author,FieldValuesAsText&$filter=LSiCommentPageID+eq+'${blog.Id}'&orderby=Created+desc`;
    
    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        blog.MyComments = res.json().d.results.map(item=>{
          item.MyCreated = moment(item.Created).fromNow();
          return item;
        });
      })
      .catch(error=>{
        console.log('<Blogs> getComments error: ',error);
      })
    
  }

  public postLiked(event,item) :  Promise<any> { 
    event.target.offsetParent.disabled = true;
    item.liked = item.liked? false : true;
    item.liked?item.LikesCount++ : item.LikesCount--;

    let errorShow = ()=>{
      item.liked = item.liked? false : true;
      item.liked?item.LikesCount++ : item.LikesCount--;
      this.showToast(this.loc.dic.mobile.OperationError+'. '+(item.liked?this.loc.dic.mobile.NotLike:this.loc.dic.mobile.Like)+' '+this.loc.dic.mobile.unsaved);
      event.target.offsetParent.disabled = false;
    }

    let url = `${consts.siteUrl}/_vti_bin/client.svc/ProcessQuery`;
  
    let body = `<Request xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="Javascript Library"><Actions><StaticMethod TypeId="{d9c758a9-d32d-4c9c-ab60-46fd8b3c79b7}" Name="SetLike" Id="63"><Parameters><Parameter Type="String">{${this.guid}}</Parameter><Parameter Type="Number">${item.Id}</Parameter><Parameter Type="Boolean">${item.liked}</Parameter></Parameters></StaticMethod></Actions><ObjectPaths><Identity Id="11" Name="list:${this.guid}:item:${item.Id},1" /></ObjectPaths></Request>`;//f864f49d-4048-4000-b229-0df7c147a8b5|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:1df0ee95-1aa9-4f4c-ada5-97fa92602100:web:b377927e-6145-44a4-bb08-cf8e710fecdc:
    let headers = new Headers({"Authorization":(window.localStorage.getItem('OnPremise')?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'Accept': 'application/json;odata=verbose',"Content-Type": "text/xml"});
    let options = new RequestOptions({ headers: headers });

    return this.http.post(url,body,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(data=>{
        if(data.json()[0].ErrorInfo){
          let itemurl = `${consts.siteUrl}/_api/web/lists('${this.guid}')/items(${item.Id})?$select=LikesCount,LikedByStringId,Id`

          return this.http.get(itemurl,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
            .then(response=>{
              let res = response.json().d;
              if(res.LikesCount != item.LikesCount) {
                errorShow();
              }
              event.target.offsetParent.disabled = false;
            })
            .catch(error=>{
              console.error('<News> check like error:',error);
              errorShow();
            })
            
        } else {
          event.target.offsetParent.disabled = false;
        }
      })
      .catch(error=>{
        console.log('<News> Liked error:',error);
        errorShow();
      })

  }

  public openPost(blog) : void {
    this.navCtrl.push(Post,{blog:blog,guid:this.guid,comment_list:this.commentlist_guid,postLiked:this.postLiked});
  }

  private showToast(message: any){
      let toast = this.toastCtrl.create({
        message: (typeof message == 'string' )? message.substring(0,( message.indexOf('&#x') != -1? message.indexOf('&#x') : message.length)) : message.toString().substring(0,( message.toString().indexOf('&#x') != -1 ?message.toString().indexOf('&#x') : message.toString().length)) ,
        position: 'bottom',
        showCloseButton : true,
        duration: 9000
      });
      toast.present();
      toast.onDidDismiss(()=>{
        this.backbuttonPressed = 0;
      })
  }

}
