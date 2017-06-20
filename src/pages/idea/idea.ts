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
    let target = '<View>'+
                // '<ViewAttribute>'+
                //     `<FieldRef Name='LikedBy' /><FieldRef Name='LSiIdeaStatus' /><FieldRef Name='LikesCount' />`+
                //   '</ViewAttribute>'+
                '<ViewFields>'+
                    `<FieldRef Name="ID"></FieldRef>`+
                    `<FieldRef Name="Title"></FieldRef>`+
                    `<FieldRef Name="LikesCount"></FieldRef>`+
                    `<FieldRef Name="LikedBy" />`+
                    `<FieldRef Name="AuthorId" />`+
                `</ViewFields>`+
                `<ProjectedFields>`+
                  `<Field Name="AuthorId" Type="Lookup" ShowField="Title" />`+
                `</ProjectedFields>`+
                '<Query>'+
                    '<Where><Eq><FieldRef Name=\'LSiIdeaStatus\' /><Value Type=\'Text\'>Active</Value></Eq></Where>'+
        				 '<RowLimit>10</RowLimit>'+
                //  "<queryOptions>"+
                //       "<QueryOptions>"+
                //           "<IncludeMandatoryColumns>FALSE</IncludeMandatoryColumns>"+
                //           "<ViewFieldsOnly>TRUE</ViewFieldsOnly>"+
                //       "</QueryOptions>"+
                //   "</queryOptions>"+
        			'</View>';

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
