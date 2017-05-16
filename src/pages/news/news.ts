import { Component, Inject } from '@angular/core';
import { NavController, NavParams, Platform, Events } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';
import { Images } from '../../utils/images';
import { User } from '../../utils/user';

import { Card } from './card/card';

@Component({
  selector: 'page-news',
  templateUrl: 'news.html',
})
export class News {
  
  title: string;
  guid:string;
  News: any;

  constructor(public platform: Platform,public navCtrl: NavController,public events : Events, @Inject(User) public user : User, public navParams: NavParams,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization,public http : Http) {
    this.title = navParams.data.title || loc.dic.modules.News;
    this.guid = navParams.data.guid;

    this.platform.ready().then(() => {
      this.events.subscribe('user:loaded',(guid)=>{
        this.guid = guid;
        this.getNews();
      });
      this.guid && this.getNews();
    });
  }

  private getNews(loadNew? : boolean) : Promise<any> {
    let lastDate = this.News && this.News.length > 1 && loadNew ? encodeURI(encodeURIComponent(this.News[this.News.length-1].LSiNewsDate.replace(/-/g,'').replace('T',' ').replace('Z',''))) : false;
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/items?${ lastDate ? '$skiptoken=Paged=TRUE=p_LSiNewsDate='+lastDate+'&' : ''}$top=5&$orderby=LSiNewsDate+desc&$expand=FieldValuesAsText&$filter=ContentTypeId+eq+'0x010100C568DB52D9D0A14D9B2FDCC96666E9F2007948130EC3DB064584E219954237AF3900810CD0D360D80542BC6396D515AB1E3700096A9BAA8C2FA345B2A6F2E29566FD63'`;
    
    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(response=>{
        console.log('News:',response.json())
        return response.json().d.results;
      })
      .then((news : Array<any>)=>{
        news.map((item) =>{
          !item.LSiNewsTags && (item.LSiNewsTags.results = []);
          item.liked = item.LikedByStringId && item.LikedByStringId.results && item.LikedByStringId.results.lastIndexOf(this.user.getId().toString()) != -1? true : false;
          item.MyDate = (new Date(item.LSiNewsDate)).toLocaleString();
          item.MyBody = item.FieldValuesAsText.LSiNewsShortDescription.length > 230 ? item.FieldValuesAsText.LSiNewsShortDescription.substring(0,(item.FieldValuesAsText.LSiNewsShortDescription.substring(0,230).lastIndexOf(' ') != -1?item.FieldValuesAsText.LSiNewsShortDescription.substring(0,230).lastIndexOf(' ') : 230))+ "..."  : item.FieldValuesAsText.LSiNewsShortDescription;
          
          let imageUrl = `${consts.siteUrl}/_api/web/lists('${this.guid}')/Items(${item.Id})/FieldValuesAsHtml?$select=LSiNewsImage`;
          let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
          let options = new RequestOptions({ headers: headers ,withCredentials: true});

          this.http.get(imageUrl,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
            .then(res=>{
              let str = res.json().d.LSiNewsImage;
              //////////////////Warning
              item.Image = consts.siteUrl + str.substring(str.indexOf('src="/sites/lsintranet365')+'src=\"sites/lsintranet365'.length+1,str.lastIndexOf('.')+4);///  -4
            })
            .catch(error=>{
              console.error('<News> Load images error:',error)
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

  public newsLiked(item) : void {
    console.log('news liked:',item);
    item.liked = item.liked? false : true;
    item.liked?item.LikesCount++ : item.LikesCount--;
  }

  public openCard(item) : void {
    this.navCtrl.push(Card,item);
  }

  public doInfinite(infiniteScroll) : void {
    this.getNews(true)
      .then( () =>{
        infiniteScroll.complete();
      })
  }

}
