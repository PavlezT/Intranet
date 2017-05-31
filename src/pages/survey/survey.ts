import { Component, Inject } from '@angular/core';
import { NavController, NavParams,  ToastController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';

import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';
import { User } from '../../utils/user';
import { Access } from '../../utils/access';
import { Loader } from '../../utils/loader';

@Component({
  selector: 'page-survey',
  templateUrl: 'survey.html',
})
export class Survey {
  
  title: string;
  guid:string;
  config : any;
  question : string;
  Answers : any;
  Surveys : any;
  current_question : number;
  survey_answer : any;
  survey_answers : Array<string>;

  access_token : string;
  digest : string;

  constructor(public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization,private toastCtrl: ToastController, @Inject(Loader) public loaderctrl: Loader, @Inject(Access) public access : Access, public http: Http,@Inject(User) private user : User) {
    this.title = navParams.data.title;
    this.current_question = 0;
    this.survey_answers = [];

    Promise.all([access.getToken().then(token => this.access_token = token),access.getDigestValue().then(digest => this.digest = digest)])
      .then(()=>{
        return this.getConfig();
      })
      .then(()=>{
          let temp = JSON.parse(this.config.PollListId);
          this.guid = temp[Object.keys(temp)[0]];
          return this.getUserAnswers();
      })
      .then((state)=>{
        state ? this.getAllAnswers() : this.getSurvey();
      })
      .catch(custom_error=>{
        console.log('<Survey> custom error:',custom_error);
      })
  }

  private getConfig() : Promise<any> {
    let url= `${consts.siteUrl}/_catalogs/masterpage/LSIntranet/js/core/LSi.Config.js`;

    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        let temp = res.text();
        temp = temp.substring(temp.indexOf('LSi.Config.Obj =')+"LSi.Config.Obj =".length,temp.length);
        this.config = JSON.parse(temp);
      })
      .catch(error=>{
        console.log('<Survey> get config error:',error);
        this.config = {};
        throw new Object({error:error});
      })
  }

  private getSurvey(guid? : string) : Promise<any>{
    let url= `${consts.siteUrl}/_api/web/lists('${guid? guid : this.guid}')/Fields?$select=Title,Id,Choices,EntityPropertyName&$filter=(CanBeDeleted eq true) and (TypeAsString eq 'Choice')`;

    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        this.Surveys = res.json().d.results;
        this.refreshSurvey(this.current_question);
      })
      .catch(error=>{
        console.log('<Survey> get Survey error:',error);
        this.question = '';
        this.Answers = [];
      })
  }

  private getUserAnswers() : Promise<any> {
    let CamlC = `<View><Query><Where><Eq><FieldRef Name='Author' LookupId='TRUE' /><Value Type='Integer'>${this.user.getId()}</Value></Eq></Where></Query></View>`;
    let url = `${consts.siteUrl}/_api/web/lists(guid'${this.guid}')/getitems`
    let body = {
      query : {
        '__metadata': {
           type: 'SP.CamlQuery' 
        },
        ViewXml: CamlC 
      }
    }

    let headers = new Headers({"Authorization":(consts.OnPremise?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'Accept': 'application/json;odata=verbose',"Content-Type": "application/json;odata=verbose"});
    let options = new RequestOptions({ headers: headers });

    return this.http.post(url,JSON.stringify(body),options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        console.log('user ansers',res.json());

        return res.json().d.results.length != 0;//? true : false;
      })
      .catch(error=>{
        console.log('<Survey> get User Answers error:',error);
        return false;
      })
  }

  private getAllAnswers() : Promise<any> { 
    let url = `${consts.siteUrl}/_api/web/lists(guid'${this.guid}')/Items`;

    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        this.Answers = res.json().d.results.map(answer=>{
          this.Surveys.map(item=>{
            !item.Choices.counts && (item.Choices.counts = []);
            item.Choices.counts[item.Choices.results.indexOf(answer[item.EntityPropertyName])]++;
          })
        })
      })
      .catch(error=>{
        console.log('<Survey> get All Answers error:',error);
      })
  }
//ngIf = "!question && Answers.length != 0"

  public acceptAnswer() : void {
    this.survey_answer ? this.survey_answers.push(this.survey_answer) : this.showToast(this.loc.dic.mobile.Make+' '+this.loc.dic.mobile.choice);
    this.survey_answer && (this.Surveys[this.current_question+1] ? this.refreshSurvey(++this.current_question) : this.sendResults());
    this.survey_answer =  null;
  }

  private refreshSurvey(index) : void {
    this.question = this.Surveys[index].Title;
    this.Answers = this.Surveys[index].Choices.results;
  }

  private sendResults() : Promise<any> {
    this.loaderctrl.presentLoading();
    this.question = null;
    this.getAllAnswers();
    return Promise.resolve(this.loaderctrl.stopLoading());
  }

  private showToast(message: any){
      let toast = this.toastCtrl.create({
        message: (typeof message == 'string' )? message.substring(0,( message.indexOf('&#x') != -1? message.indexOf('&#x') : message.length)) : message.toString().substring(0,( message.toString().indexOf('&#x') != -1 ?message.toString().indexOf('&#x') : message.toString().length)) ,
        position: 'bottom',
        showCloseButton : true,
        duration: 2500
      });
      toast.present();
  }

}
