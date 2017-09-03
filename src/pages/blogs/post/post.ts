import { Component, Inject, ViewChild } from '@angular/core';
import { NavController, NavParams, Platform, ToastController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as moment from 'moment';

import * as consts from '../../../utils/consts';
import { Localization } from '../../../utils/localization';
import { Images } from '../../../utils/images';
import { Access } from '../../../utils/access';
import { User } from '../../../utils/user';

@Component({
  selector: 'page-post',
  templateUrl: 'post.html',
})
export class Post {

    @ViewChild('textcomment') textcomment : any;

    digest : string;
    access_token : string;
    postLiked : any;
    comment_list : string;
    
    title: string;
    guid:string;
    post : any;

    constructor(public platform : Platform,public navCtrl: NavController, public navParams: NavParams,private toastCtrl: ToastController,@Inject(User) public user : User, @Inject(Access) public access : Access,@Inject(Images) public images: Images, @Inject(Localization) public loc : Localization, public http : Http) {
        this.title = navParams.data.blog.Title;
        this.guid = navParams.data.guid;
        this.comment_list = navParams.data.comment_list;
        this.post = navParams.data.blog;
        this.postLiked  = navParams.data.postLiked;

        this.getImage();
        access.getToken().then(token => this.access_token = token);
        access.getDigestValue().then(digest => this.digest = digest);
    }

    ionViewDidEnter(){
        this.platform.registerBackButtonAction((e)=>{
          this.navCtrl.pop();
        },100);
    }

    public focuse (target : string) : void {
        console.log('focuse');
    }

    public getImage() : Promise<any> {
        let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/items(${this.post.Id})/FieldValuesAsHTML?$select=LSiNewsImage`;

        let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
        let options = new RequestOptions({ headers: headers ,withCredentials: true});

        return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
            .then(res=>{
                let str = res.json().d.LSiNewsImage;
                this.post.Image = str.substring(str.indexOf('src="/sites/lsintranet365')+'src=\"sites/lsintranet365'.length+1,str.lastIndexOf('.')+4);///  -4
            })
            .catch(error=>{
                console.log('<Post> getImage error:',error);
                //return this.getImage();
            })

    }

    public sendComment(button) : Promise<any>{
        if(!(this.textcomment.value.length > 0))return Promise.resolve();
        button.target.parentNode.disabled = true;
        let url = `${consts.siteUrl}/_api/Web/Lists('${this.comment_list}')/Items`;
        let body = {
            "__metadata": {
                type : 'SP.Data.LSiBlogCommentsListListItem'
            },
            LSiCommentText : this.textcomment.value,
            LSiCommentPageID : this.post.Id,
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
                comment.Author = {
                    Title : this.user.getUserName(),
                    EMail : this.user.getEmail()
                }
                this.post.MyComments.push(comment);
            })
            .catch(error=>{
                button.target.parentNode.disabled = false;
                console.error('<Post> Send Comment error:',error);
                this.showToast(this.loc.dic.mobile.OperationError+'. '+this.loc.dic.NotifField_TaskComment+' '+this.loc.dic.mobile.unsaved);
            })
    }

    public getBackImage() : string {
        return `url(${this.images.getImage(this.post.Image)})`;
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
  