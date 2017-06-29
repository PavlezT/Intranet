import { Component, Inject } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as moment from 'moment';
import 'moment/locale/uk';
import 'moment/locale/ru';
import 'moment/locale/en-gb';

import * as consts from '../../utils/consts'
import { Localization } from '../../utils/localization';
import { Access } from '../../utils/access';
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

  constructor(public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization,@Inject(Images) public images: Images,@Inject(Access) public access : Access,public http : Http) {
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
      this.New = data.Row;
    })
  }

  public getBest() : void {
    let target = `LikesCount`;

    this.getIdeas(target).then(data=>{
      this.Best = data.Row;
    })
  }

  private getIdeas(target : string) : Promise<any> {//Created
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
        console.log('res.json:',JSON.parse(res.json().d.RenderListData));
        return JSON.parse(res.json().d.RenderListData);
      })
      .catch(error=>{
        console.log('<Idea> getIdeas error:',error);
        return [];
      })
  }

  public ideaLiked(event,idea){
    console.log('idea liked')
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