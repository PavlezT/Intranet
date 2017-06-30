import { Component, Inject } from '@angular/core';
import { NavController, NavParams, ToastController, AlertController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as moment from 'moment';
import 'moment/locale/uk';
import 'moment/locale/ru';
import 'moment/locale/en-gb';

import * as consts from '../../utils/consts'
import { Localization } from '../../utils/localization';
import { Access } from '../../utils/access';
import { User } from '../../utils/user';
import { Images } from '../../utils/images';

@Component({
  selector: 'page-idea',
  templateUrl: 'idea.html',
})
export class IdeaBox {

  title: string;
  guid: string;
  Best : any;
  New : any;
  ideas : any;

  access_token : string;
  digest : string;

  constructor(public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization,private alertCtrl: AlertController,@Inject(Images) public images: Images,private toastCtrl: ToastController, @Inject(User) public user : User,@Inject(Access) public access : Access,public http : Http) {
    this.title = navParams.data.title || loc.dic.modules.IdeaBox;
    this.guid = navParams.data.guid;
    this.ideas = 'best';
    
    Promise.all([access.getToken().then(token => this.access_token = token),access.getDigestValue().then(digest => this.digest = digest)])
      .then(()=>{
        moment.locale(this.loc.localization);
        this.getBest();
      }) 
  }

  public getNew() : void {
    let target = `Created`;

    this.getIdeas(target).then(data=>{
      this.New = data;
    })
  }

  public getBest() : void {
    let target = `LikesCount`;

    this.getIdeas(target).then(data=>{
      this.Best = data;
    })
  }

  private getIdeas(target : string) : Promise<any> {
    //items?$select=Title,Id,LSiIdeaStatus,LikesCount,Created,Author/Id,Author/Title,Author/EMail,LikedBy/Id,LikedBy/Title,LikedBy/EMail&$filter=LSiIdeaStatus+eq+'Active'&$orderby=Created desc&$top=10&$expand=LikedBy,Author
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/renderlistdata(@viewXml)?@viewXml=`+
      `'<View>`+
        `<ViewFields>`+
            `<FieldRef Name="Author" />`+
            `<FieldRef Name="Body" TextOnly="TRUE" RefType = "Text" Format = "Text" DisplayName = "Text" Type = "Text"/>`+
            `<FieldRef Name="Created" />`+
            `<FieldRef Name="LikesCount" />`+
            `<FieldRef Name="Id" />`+
            `<FieldRef Name="Title" />`+
        `</ViewFields>`+
        `<RowLimit>10</RowLimit>`+
        `<Query>`+
          `<Where>`+
            `<Eq>`+
              `<FieldRef Name="LSiIdeaStatus" />`+
                `<Value Type="Text">Active</Value>`+
            `</Eq>`+
          `</Where>`+
          `<OrderBy>`+
            `<FieldRef Name="${target}" Ascending="False" />`+
          `</OrderBy>`+
        `</Query>`+
      `</View>'`;
    
    let headers = new Headers({"Authorization":(consts.OnPremise?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'Accept': 'application/json;odata=verbose',"Content-Type": "application/json;odata=verbose"});
    let options = new RequestOptions({ headers: headers });

    return this.http.post(url,{},options).timeout(consts.timeoutDelay+3000).retry(consts.retryCount).toPromise()
      .then(res=>{
        return JSON.parse(res.json().d.RenderListData).Row.map(item=>{
          item.liked = item.LikedBy && item.LikedBy.find((likes_item)=>{return likes_item.id == this.user.getId().toString()}) ? true : false;
          item.textBody = this.getParsedBody(item.Body);
          item.MyComments = [];
          this.getComments(item);
          return item;
        })
      })
      .catch(error=>{
        console.log('<Idea> getIdeas error:',error);
        return [];
      })
  }

  private getComments(idea : any) : Promise<any> {
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/Items?$select=Title,Id,LikesCount,Body,LikedByStringId,FieldValuesAsText/Body,ParentItemID,Created,Author/Id,Author/Title,Author/EMail&$expand=FieldValuesAsText,Author&$filter=ParentItemID+eq+${idea.ID}`;
    
    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        idea.MyComments = res.json().d.results.map(item=>{
          item.MyCreated = moment(item.Created).fromNow();
          item.liked = item.LikedByStringId && item.LikedByStringId.results && item.LikedByStringId.results.lastIndexOf(this.user.getId().toString()) != -1? true : false;
          return item;
        });
      })
      .catch(error=>{
        console.log('<Idea> getComments error: ',error);
      })
  }

  public ideaLiked(event,item){
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
    let body = `<Request xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="Javascript Library"><Actions><StaticMethod TypeId="{d9c758a9-d32d-4c9c-ab60-46fd8b3c79b7}" Name="SetLike" Id="63"><Parameters><Parameter Type="String">{${this.guid}}</Parameter><Parameter Type="Number">${item.ID}</Parameter><Parameter Type="Boolean">${item.liked}</Parameter></Parameters></StaticMethod></Actions><ObjectPaths><Identity Id="11" Name="list:${this.guid}:item:${item.ID},1" /></ObjectPaths></Request>`;
    let headers = new Headers({"Authorization":(consts.OnPremise?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'Accept': 'application/json;odata=verbose',"Content-Type": "text/xml"});
    let options = new RequestOptions({ headers: headers });

    return this.http.post(url,body,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(data=>{
        if(data.json()[0].ErrorInfo){
          let itemurl = `${consts.siteUrl}/_api/web/lists('${this.guid}')/items(${item.ID})?$select=LikesCount,LikedByStringId,Id`

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

  public getPoints(number:number) : string {
    let cases = [2, 0, 1, 1, 1, 2];  
    return this.loc.dic.mobile['point'+((number%100>4 && number%100<20)? 2 : (cases[(number%10<5) ? number%10 : 5])) ];  
  }

  public getParsedBody(body) : string {
    // let temp = (new DOMParser().parseFromString(item.Body, "text/html"));
    // item.textBody = (temp && temp.getElementsByTagName('p') )? temp.getElementsByTagName('p').item(0).textContent : this.loc.dic.mobile.Empty;
    let temp = document.createElement('template');
    temp.innerHTML = body;
    return temp.content.textContent || this.loc.dic.mobile.Empty;
  }

  private ideaComment(item : any, text : {comment_text:string} ) : Promise<any> {
    console.log('item.ID:',item.ID)
    if(!(text.comment_text.length > 0))return Promise.resolve();
    let url = `${consts.siteUrl}/_api/Web/Lists('${this.guid}')/Items`;
    let body = {
        "__metadata": {
          type : 'SP.Data.LSiIdeaBankListItem'
        },
        Body : text.comment_text,
        ParentItemID : item.ID,
        "AuthorId" : this.user.getId()
    }
    let headers = new Headers({"Authorization":(consts.OnPremise?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'X-HTTP-Method':'POST','IF-MATCH': '*','Accept': 'application/json;odata=verbose',"Content-Type": "application/json;odata=verbose"});
    let options = new RequestOptions({ headers: headers,withCredentials: true });

    return this.http.post(url,JSON.stringify(body),options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then((data)=>{        
        let comment = data.json().d;
        comment.FieldValuesAsText.Body = text.comment_text;
        comment.MyCreated = moment().fromNow();
        comment.Author = {
          Title : this.user.getUserName(),
          EMail : this.user.getEmail()
        }
        item.MyComments.push(comment);
      })
      .catch(error=>{
        console.error('<Idea> Send Comment error:',error);
        this.showToast(this.loc.dic.mobile.OperationError+'. '+this.loc.dic.NotifField_TaskComment+' '+this.loc.dic.mobile.unsaved);
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

  private showPrompt(item) : void {
    let prompt = this.alertCtrl.create({
      title: this.loc.dic.mobile.Comment,
      message: this.loc.dic.Alert14,
      enableBackdropDismiss: true,
      inputs: [
        {
          name: 'comment_text',
          type:'text'
        }
      ],
      buttons: [
        {
          text: this.loc.dic.Close,
          role: 'cancel',
          handler: data => {
            //prompt.dismiss();
          }
        },
        {
          text: this.loc.dic.Accept,
          handler: data => {
            this.ideaComment(item,data)
          }
        }
      ]
    });
    prompt.present();
  }

}

//target query:
//`<View><ViewFields><FieldRef Name="Title" /><FieldRef Name="UserTitle" /><FieldRef Name="UserEmail" /></ViewFields><RowLimit>10</RowLimit><Joins><Join Type="LEFT" ListAlias="MyAuthore"><Eq><FieldRef Name="Author" RefType="ID" /><FieldRef Name="ID" List="MyAuthore" /></Eq></Join></Joins><ProjectedFields><Field ShowField="Title" Type="Lookup" Name="UserTitle" List="MyAuthore" /><Field ShowField="EMail" Type="Lookup" Name="UserEmail" List="MyAuthore" /></ProjectedFields><Query><Where><Eq><FieldRef Name="LSiIdeaStatus" /><Value Type="Text">Active</Value></Eq></Where><OrderBy><FieldRef Name="LikesCount" Ascending="False" /></OrderBy></Query></View>`;
            // `<View>
            //   <ViewFields>
            //       <FieldRef Name="Title" />
            //       <FieldRef Name="UserTitle" />
            //       <FieldRef Name="UserEmail" />
            //       <FieldRef Name="Body" />
            //   </ViewFields>
            //   <RowLimit>10</RowLimit>
            //   <Joins>
            //       <Join Type="LEFT" ListAlias="MyAuthore">
            //           <Eq>
            //               <FieldRef Name="Author" RefType="ID" />
            //               <FieldRef Name="ID" List="MyAuthore" />
            //           </Eq>
            //       </Join>
            //   </Joins>
            //   <ProjectedFields>
            //       <Field ShowField="Title" Type="Lookup" Name="UserTitle" List="MyAuthore" />
            //       <Field ShowField="EMail" Type="Lookup" Name="UserEmail" List="MyAuthore" />
            //   </ProjectedFields>
            //   <Query>
            //       <Where>
            //           <Eq>
            //               <FieldRef Name="LSiIdeaStatus" />
            //               <Value Type="Text">Active</Value>
            //           </Eq>
            //       </Where>
            //       <OrderBy>
            //           <FieldRef Name="LikesCount" Ascending="False" />
            //       </OrderBy>
            //   </Query>
            // </View>`;


//ProcessQuary
// `<Request xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="Javascript Library">`+
//                   `<Actions>`+
//                     `<ObjectPath Id="6727" ObjectPathId="6726" />`+
//                       `<Query Id="6728" ObjectPathId="6726">`+
//                         `<Query SelectAllProperties="true">`+
//                           `<Properties />`+
//                         `</Query>`+
//                         `<ChildItemQuery SelectAllProperties="true">`+
//                           `<Properties />`+
//                         `</ChildItemQuery>`+
//                       `</Query>`+
//                     `</Actions>`+
//                     `<ObjectPaths>`+
//                       `<Method Id="6726" ParentId="259" Name="GetItems">`+
//                         `<Parameters>`+
//                           `<Parameter TypeId="{3d248d7b-fc86-40a3-aa97-02a75d69fb8a}">`+
//                             `<Property Name="DatesInUtc" Type="Boolean">true</Property>`+
//                             `<Property Name="ViewXml" Type="String">`+
//                               `&lt;View&gt;&lt;ViewFields&gt;&lt;FieldRef Name="Title" /&gt;&lt;FieldRef Name="UserTitle" /&gt;&lt;FieldRef Name="UserEmail" /&gt;&lt;FieldRef Name="Body" /&gt;&lt;/ViewFields&gt;&lt;RowLimit&gt;10&lt;/RowLimit&gt;&lt;Joins&gt;&lt;Join Type="LEFT" ListAlias="MyAuthore"&gt;&lt;Eq&gt;&lt;FieldRef Name="Author" RefType="ID" /&gt;&lt;FieldRef Name="ID" List="MyAuthore" /&gt;&lt;/Eq&gt;&lt;/Join&gt;&lt;/Joins&gt;&lt;ProjectedFields&gt;&lt;Field ShowField="Title" Type="Lookup" Name="UserTitle" List="MyAuthore" /&gt;&lt;Field ShowField="EMail" Type="Lookup" Name="UserEmail" List="MyAuthore" /&gt;&lt;/ProjectedFields&gt;`+
//                                 `&lt;Query&gt;`+
//                                   `&lt;Where&gt;`+
//                                     `&lt;Eq&gt;&lt;FieldRef Name="LSiIdeaStatus" /&gt;`+
//                                       `&lt;Value Type="Text"&gt;Active&lt;/Value&gt;`+
//                                     `&lt;/Eq&gt;`+
//                                   `&lt;/Where&gt;`+
//                                   `&lt;OrderBy&gt;`+
//                                     `&lt;FieldRef Name="${target}" Ascending="False" /&gt;`+
//                                   `&lt;/OrderBy&gt;&lt;/Query&gt;&lt;/View&gt;`+
//                             `</Property>`+
//                           `</Parameter>`+
//                         `</Parameters>`+
//                       `</Method>`+
//                       `<Method Id="259" ParentId="255" Name="GetById">`+
//                         `<Parameters>`+
//                           `<Parameter Type="String">${this.guid}</Parameter>`+
//                         `</Parameters>`+
//                       `</Method>`+
//                       `<Property Id="255" ParentId="11" Name="Lists" />`+
//                       `<Identity Id="11" Name="064f009e-201c-4000-b229-01a17d0baf8f|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:1df0ee95-1aa9-4f4c-ada5-97fa92602100:web:b377927e-6145-44a4-bb08-cf8e710fecdc" />`+
//                     `</ObjectPaths>`+
//                   `</Request>`