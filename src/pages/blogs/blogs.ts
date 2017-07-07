import { Component, Inject } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';
import { Images } from '../../utils/images';

@Component({
  selector: 'page-blogs',
  templateUrl: 'blogs.html',
})
export class Blogs {
  
  title: string;
  guid:string;

  Blogs : any;
  
  constructor(public navCtrl: NavController, public navParams: NavParams,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization, public http : Http) {
    this.title = navParams.data.title;
    this.guid = navParams.data.guid;

    this.getBlogs();
  }

  private getBlogs() : Promise<any> {
    let url = `${consts.siteUrl}/_api/Web/Lists('${this.guid}')/Items?$select=Title,Id,LSiBlogCategory,Created,LikesCount,LSiNewsBody,LSiNewsShortDescription,`+
              `Author/Title,Author/JobTitle,Author/EMail,ContentType/Name,FieldValuesAsText/LSiNewsBody,FieldValuesAsText/LSiNewsShortDescription,`+
              `LikedBy/UserName,LikedBy/EMail,LikedBy/Id&$expand=Author,FieldValuesAsText,ContentType,LikedBy&$filter=ContentTypeId+eq+`+
              `'0x010100C568DB52D9D0A14D9B2FDCC96666E9F2007948130EC3DB064584E219954237AF39006B501587D2B00E41AEB6CE25B613EAC9004B61128CCCEC874B87E3A9CBA486DE54'`

    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        this.Blogs = res.json().d.results.map(post=>{
          post.MyCreated = (new Date(post.Created)).toLocaleDateString();
          post.liked = false;
          post.MyComments = [];
          this.getComments(post);
          return post;
        })
        console.log('this.Blogs:',this.Blogs)
      })
      .catch(error=>{
        console.log('<OrgStructure> get departments error:',error);
        return this.getBlogs();
        //this.Blogs = [];
      })
  }

  private getComments(blog) : Promise<any> {
    return Promise.resolve();
  }

  public postLiked($event,item) :  Promise<any> { 
    return Promise.resolve();
  }

}
