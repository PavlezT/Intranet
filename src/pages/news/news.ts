import { Component, Inject } from '@angular/core';
import { NavController, NavParams, Platform, Events, ToastController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';
import { Images } from '../../utils/images';
import { User } from '../../utils/user';
import { Access } from '../../utils/access';

import { Card } from './card/card';

@Component({
  selector: 'page-news',
  templateUrl: 'news.html',
})
export class News {
  
  title: string;
  guid:string;
  News: any;
  digest : string;
  access_token : string;
  backbuttonPressed : number;

  constructor(public platform: Platform,public navCtrl: NavController,public events : Events, @Inject(Access) public access : Access,@Inject(User) public user : User, public navParams: NavParams,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization,public http : Http,private toastCtrl: ToastController) {
    this.title = navParams.data.title || loc.dic.modules.News;
    this.guid = navParams.data.guid;
    this.backbuttonPressed = 0;

    this.platform.ready().then(() => {
      this.events.subscribe('user:loaded',(guid)=>{
        this.guid = guid;
        this.getNews();
        access.getDigestValue().then(digest => this.digest = digest);
        access.getToken().then(token => this.access_token = token);
      });
      this.guid && this.getNews();
      access.getToken().then(token => this.access_token = token);
      access.getDigestValue().then(digest => this.digest = digest);
    });

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
  
  private getNews(loadNew? : boolean) : Promise<any> {
    let lastDate = this.News && this.News.length > 1 && loadNew ? encodeURI(encodeURIComponent(this.News[this.News.length-1].LSiNewsDate.replace(/-/g,'').replace('T',' ').replace('Z',''))) : false;
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/items?${ lastDate ? '$skiptoken=Paged=TRUE=p_LSiNewsDate='+lastDate+'&' : ''}$top=5&$orderby=LSiNewsDate+desc&$expand=FieldValuesAsText&$filter=ContentTypeId+eq+'0x010100C568DB52D9D0A14D9B2FDCC96666E9F2007948130EC3DB064584E219954237AF3900810CD0D360D80542BC6396D515AB1E3700096A9BAA8C2FA345B2A6F2E29566FD63'`;
    
    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(response=>{
        return response.json().d.results;
      })
      .then((news : Array<any>)=>{
        let commentsListGuid = JSON.parse(window.localStorage.getItem('lsi'))['LSiNewsCommentsList'];
        news.map((item) =>{
          !item.LSiNewsTags && (item.LSiNewsTags.results = []);
          item.liked = item.LikedByStringId && item.LikedByStringId.results && item.LikedByStringId.results.lastIndexOf(this.user.getId().toString()) != -1? true : false;
          item.MyDate = (new Date(item.LSiNewsDate)).toLocaleDateString();
          item.MyBody = item.FieldValuesAsText.LSiNewsShortDescription.length > 230 ? item.FieldValuesAsText.LSiNewsShortDescription.substring(0,(item.FieldValuesAsText.LSiNewsShortDescription.substring(0,230).lastIndexOf(' ') != -1?item.FieldValuesAsText.LSiNewsShortDescription.substring(0,230).lastIndexOf(' ') : 230))+ "..."  : item.FieldValuesAsText.LSiNewsShortDescription;
          item.MyComments = [];
          item.commentsListGuid = commentsListGuid;

          let imageUrl = `${consts.siteUrl}/_api/web/lists('${this.guid}')/Items(${item.Id})/FieldValuesAsHtml?$select=LSiNewsImage`;
          let commentsUrl = `${consts.siteUrl}/_api/web/lists('${commentsListGuid}')/Items?$select=LSiCommentPageID,ID,LSiCommentText,Author/Id,Author/Title,Author/EMail,Created,FieldValuesAsText/LSiCommentText&$filter=LSiCommentPageID+eq+${item.Id}&$expand=FieldValuesAsText/Id,Author/Id`
          let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
          let options = new RequestOptions({ headers: headers ,withCredentials: true});

          Promise.all([this.http.get(imageUrl,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise(),this.http.get(commentsUrl,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()])
            .then(res=>{
              item.MyComments = res[1].json().d.results;
              
              let str = res[0].json().d.LSiNewsImage;
              //////////////////Warning
              item.Image = str.substring(str.indexOf('src="/sites/lsintranet365')+'src=\"sites/lsintranet365'.length+1,str.lastIndexOf('.')+4);///  -4
            })
            .catch(error=>{
              console.error('<News> Load images or Comments error:',error)
            })
            loadNew && this.News.push(item);
        })
        !loadNew && (this.News = news);
      })
      .catch(error=>{
        console.error('<News> Loading News error!',error);
        !this.News && (this.News = []);
      })
  }

  public newsLiked(event,item) : Promise<any> {
    event.target.offsetParent.disabled = true;
    item.liked = item.liked? false : true;
    item.liked?item.LikesCount++ : item.LikesCount--;

    let errorShow = ()=>{
      item.liked = item.liked? false : true;
      item.liked?item.LikesCount++ : item.LikesCount--;
      this.showToast(this.loc.dic.mobile.OperationError+'. '+(item.liked?this.loc.dic.mobile.Like:this.loc.dic.mobile.NotLike)+' '+this.loc.dic.mobile.unsaved);
      event.target.offsetParent.disabled = false;
    }

    let url = `${consts.siteUrl}/_vti_bin/client.svc/ProcessQuery`;
    //<Query Id="64" ObjectPathId="11"><Query SelectAllProperties="true"><Properties><Property Name="LikesCount" ScalarProperty="true" /><Property Name="LikedBy" ScalarProperty="true" /></Properties></Query></Query>
    let body = `<Request xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="Javascript Library"><Actions><StaticMethod TypeId="{d9c758a9-d32d-4c9c-ab60-46fd8b3c79b7}" Name="SetLike" Id="63"><Parameters><Parameter Type="String">{${this.guid}}</Parameter><Parameter Type="Number">${item.Id}</Parameter><Parameter Type="Boolean">${item.liked}</Parameter></Parameters></StaticMethod></Actions><ObjectPaths><Identity Id="11" Name="list:${this.guid}:item:${item.Id},1" /></ObjectPaths></Request>`;//f864f49d-4048-4000-b229-0df7c147a8b5|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:1df0ee95-1aa9-4f4c-ada5-97fa92602100:web:b377927e-6145-44a4-bb08-cf8e710fecdc:
    let headers = new Headers({"Authorization":(consts.OnPremise?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'Accept': 'application/json;odata=verbose',"Content-Type": "text/xml"});
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

  public newsComment(item) : void {
    this.openCard(item,this.guid,true);
  }

  public openCard(item,guid?:string, comments?:boolean) : void {
    this.navCtrl.push(Card,{item:item,guid:guid,comments:comments,newsLiked:this.newsLiked});
  }

  public doInfinite(infiniteScroll) : void {
    this.getNews(true)
      .then( () =>{
        infiniteScroll.complete();
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
      toast.onDidDismiss((a,b)=>{
        this.backbuttonPressed = 0;
      })
  }

}
