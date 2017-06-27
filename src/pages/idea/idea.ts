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

  access_token : string;
  digest : string;

  constructor(public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization,@Inject(Images) public images: Images,@Inject(Access) public access : Access,public http : Http) {
    this.title = navParams.data.title || loc.dic.modules.IdeaBox;
    this.guid = navParams.data.guid;

    Promise.all([access.getToken().then(token => this.access_token = token),access.getDigestValue().then(digest => this.digest = digest)])
      .then(()=>{
        moment.locale(this.loc.localization);
        this.getBest();
      }) 
  }

  public getNew() : void {
    let target = '<View>'+
						'<Query>'+
								'<Where><Eq><FieldRef Name=\'LSiIdeaStatus\' /><Value Type=\'Text\'>Active</Value></Eq></Where>'+
								'<OrderBy><FieldRef Ascending=\'FALSE\' Name=\'Created\' /></OrderBy>'+
						'</Query>' +
        				'<RowLimit>10</RowLimit>'+
        			'</View>';

    this.getIdeas(target).then(data=>{

    })
  }

  public getBest() : void {
    let target =
            `<View>
              <ViewFields>
                  <FieldRef Name="Title" />
                  <FieldRef Name="UserTitle" />
                  <FieldRef Name="UserEmail" />
              </ViewFields>
              <RowLimit>10</RowLimit>
              <Joins>
                  <Join Type="LEFT" ListAlias="MyAuthore">
                      <Eq>
                          <FieldRef Name="Author" RefType="ID" />
                          <FieldRef Name="ID" List="MyAuthore" />
                      </Eq>
                  </Join>
              </Joins>
              <ProjectedFields>
                  <Field ShowField="Title" Type="Lookup" Name="UserTitle" List="MyAuthore" />
                  <Field ShowField="EMail" Type="Lookup" Name="UserEmail" List="MyAuthore" />
              </ProjectedFields>
              <Query>
                  <Where>
                      <Eq>
                          <FieldRef Name="LSiIdeaStatus" />
                          <Value Type="Text">Active</Value>
                      </Eq>
                  </Where>
                  <OrderBy>
                      <FieldRef Name="LikesCount" Ascending="False" />
                  </OrderBy>
              </Query>
            </View>`;

    this.getIdeas(target).then(data=>{

    })
  }

  private getIdeas(target : string) : Promise<any> {//Created
    //items?$select=Title,Id,LSiIdeaStatus,LikesCount,Created,Author/Id,Author/Title,Author/EMail,LikedBy/Id,LikedBy/Title,LikedBy/EMail&$filter=LSiIdeaStatus+eq+'Active'&$orderby=Created desc&$top=10&$expand=LikedBy,Author
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/getitems`//?$select=Id,FieldValuesAsText,Title,FileLeafRef,LikesCount,LikedBy,Created,LikesCount,LikedBy&$expand=FieldValuesAsText`//LikedBy/Id,LikedBy/Title,LikedBy/EMail&$expand=LikedBy`;
    let body = {
      query : {
        '__metadata': {
           type: 'SP.CamlQuery' 
        },
        ViewXml: target 
      }
    }

    let headers = new Headers({"Authorization":(consts.OnPremise?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'Accept': 'application/json;odata=verbose',"Content-Type": "application/json;odata=verbose"});
    let options = new RequestOptions({ headers: headers });

    return this.http.post(url,JSON.stringify(body),options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        console.log('res.json:',res.json().d.results);
      })
      .catch(error=>{
        console.log('<Idea> getIdeas error:',error);
        return [];
      })
  }

}

`<Request xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="Javascript Library">
  <Actions>
    <ObjectPath Id="259122" ObjectPathId="259121"/>
    <Query Id="259123" ObjectPathId="259121">
      <Query SelectAllProperties="true">
        <Properties/>
      </Query>
      <ChildItemQuery SelectAllProperties="true">
        <Properties/>
      </ChildItemQuery>
    </Query>
  </Actions>
  <ObjectPaths>
    <Method Id="259121" ParentId="6730" Name="GetItems">
      <Parameters>
        <Parameter TypeId="{3d248d7b-fc86-40a3-aa97-02a75d69fb8a}">
          <Property Name="DatesInUtc" Type="Boolean">true</Property>
          <Property Name="FolderServerRelativePath" Type="Null"/>
          <Property Name="FolderServerRelativeUrl" Type="Null"/>
          <Property Name="ListItemCollectionPosition" Type="Null"/>
          <Property Name="ViewXml" Type="String">  </Property>
        </Parameter>
      </Parameters>
    </Method>
    <Method Id="6730" ParentId="269" Name="GetById">
      <Parameters>
        <Parameter Type="String">98ad5c04-8dc5-4e11-94d4-9f892af18e4d</Parameter>
      </Parameters>
    </Method>
    <Property Id="269" ParentId="8" Name="Lists"/>
    <Identity Id="8" Name="75aaff9d-20c0-4000-24cc-8628b4b7295f|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:1df0ee95-1aa9-4f4c-ada5-97fa92602100:web:b377927e-6145-44a4-bb08-cf8e710fecdc"/>
</ObjectPaths>
</Request>`