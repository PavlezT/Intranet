import { Component, Inject } from '@angular/core';
import { NavController, NavParams, Platform, ToastController } from 'ionic-angular';
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
  Surveys : any;
  question : string;
  current_question : number;
  Answers : any;

  survey_answer : any;
  survey_answers : Array<{EntityPropertyName:string,value:string}>;

  access_token : string;
  digest : string;

  backbuttonPressed : number;

  constructor(public platform : Platform, public navCtrl: NavController, public navParams: NavParams, @Inject(Localization) public loc : Localization,private toastCtrl: ToastController, @Inject(Loader) public loaderctrl: Loader, @Inject(Access) public access : Access, public http: Http,@Inject(User) private user : User) {
    this.title = navParams.data.title;
    this.current_question = 0;
    this.survey_answers = [];
    this.backbuttonPressed = 0;

    Promise.all([access.getToken().then(token => this.access_token = token),access.getDigestValue().then(digest => this.digest = digest)])
      .then(()=>{
        return this.getConfig();
      })
      .then(()=>{
        if(!this.config.PollListId)
          throw new Error('There is no PollListId');
        let temp = JSON.parse(this.config.PollListId);
        this.guid = temp[Object.keys(temp)[0]];
        return this.getSurvey();
      })
      .then(()=>{
        return this.getUserAnswers();
      })
      .then((state : boolean)=>{
        state ? this.getAllAnswers()
                  .then(()=>{this.refreshSurvey(this.current_question,state);})
                  .catch(error=>{ error.message && this.showToast(error.message);}) : this.refreshSurvey(this.current_question,state);
      })
      .catch(custom_error=>{
        console.log('<Survey> constructor error:',custom_error);
        this.Answers = [];
        this.question = null;
      })
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

  private getSurvey() : Promise<any>{
    let url= `${consts.siteUrl}/_api/web/lists('${this.guid}')/Fields?$select=Title,Id,Choices,EntityPropertyName&$filter=(CanBeDeleted eq true) and (TypeAsString eq 'Choice')`;

    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(res=>{
        this.Surveys = res.json().d.results;
      })
      .catch(error=>{
        console.log('<Survey> get Survey error:',error);
        this.Surveys = [{Choices:{results:[]}}];
        this.question = '';
        this.Answers = [];
      })
  }

  private getUserAnswers() : Promise<boolean> {
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

    let headers = new Headers({"Authorization":(window.localStorage.getItem('OnPremise')?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'Accept': 'application/json;odata=verbose',"Content-Type": "application/json;odata=verbose"});
    let options = new RequestOptions({ headers: headers });

    return this.http.post(url,JSON.stringify(body),options).timeout(consts.timeoutDelay+2500).retry(consts.retryCount).toPromise()
      .then(res=>{
        return res.json().d.results.length != 0;//? true : false;
      })
      .catch(error=>{
        console.log('<Survey> get User Answers error:',error);
        return true;
      })
  }

  private getAllAnswers() : Promise<any> { 
    let url = `${consts.siteUrl}/_api/web/lists(guid'${this.guid}')/Items`;

    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount+20).toPromise()
      .then(res=>{
        this.Surveys.total = 0;
        res.json().d.results.map((answer,i,mass)=>{
          //this.Surveys.total = mass.length;//this.Surveys.total?this.Surveys.total+1 : 1;
          this.Surveys.map((survey_item,i,mass)=>{
            survey_item.Choices.counts ? "" : (survey_item.Choices.counts=[]);
            if(survey_item.Choices.results.indexOf(answer[survey_item.EntityPropertyName])!= -1) {
              i+1 == mass.length && this.Surveys.total++;
              survey_item.Choices.counts[survey_item.Choices.results.indexOf(answer[survey_item.EntityPropertyName])] ?
                 survey_item.Choices.counts[survey_item.Choices.results.indexOf(answer[survey_item.EntityPropertyName])]++ 
                 : (survey_item.Choices.counts[survey_item.Choices.results.indexOf(answer[survey_item.EntityPropertyName])] = 1);
            }
          })
        })
      })
      .catch(error=>{
        console.log('<Survey> get All Answers error:',error);
        throw new Object({message:'Error occur while getting all answers. Try open tab again'});
      })
  }

  public acceptAnswer() : void {
    this.survey_answer ? this.survey_answers.push({EntityPropertyName:this.Surveys[this.current_question].EntityPropertyName,value:this.survey_answer}) : this.showToast(this.loc.dic.mobile.Make+' '+this.loc.dic.mobile.choice);
    this.survey_answer && (this.Surveys[this.current_question+1] ? this.refreshSurvey(++this.current_question) : this.sendResults());
    this.survey_answer =  null;
  }

  private refreshSurvey(index,user_answers?:boolean) : void {
    !user_answers && (this.question = this.Surveys[index].Title);
    this.Answers =  this.Surveys[index].Choices.results;// : this.Surveys[index].Choices.counts;
  }

  private sendResults() : Promise<any> {
    this.loaderctrl.presentLoading();
    
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/Items`;
    let body = {
        "__metadata": {
          type : `SP.Data.${this.config.PollListName.substring(this.config.PollListName.indexOf('":"')+'":"'.length,this.config.PollListName.indexOf('"}'))}ListItem`
        }
    }
    this.survey_answers.map(item=>{
      body[item.EntityPropertyName] = item.value;
    })

    let headers = new Headers({"Authorization":(window.localStorage.getItem('OnPremise')?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),"X-RequestDigest": this.digest,'X-HTTP-Method':'POST','IF-MATCH': '*','Accept': 'application/json;odata=verbose',"Content-Type": "application/json;odata=verbose"});
    let options = new RequestOptions({ headers: headers,withCredentials: false });

    return this.http.post(url,JSON.stringify(body),options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
            .then(res=>{
              return this.getAllAnswers();
            })
            .then(()=>{
              this.question = null;
              this.current_question = 0;
              this.loaderctrl.stopLoading();
            })
            .catch(error=>{
              console.log('<Survay> sendResults error:',error);
              this.loaderctrl.stopLoading();
              error.message && this.showToast(error.message);
            })
  }

  public previousAnswer() : void {
    this.current_question  = (this.current_question == 0) ? this.Surveys.length -1 : this.current_question-1;
  }

  public nextAnswer() : void {
    this.current_question = this.Surveys[this.current_question+1]? this.current_question+1 : 0; 
  }

  public getProcents(index) : number {
    return Math.round(((this.Surveys[this.current_question].Choices.counts[index] ? this.Surveys[this.current_question].Choices.counts[index] : 0)/(this.Surveys.total && this.Surveys.total!=0?this.Surveys.total : 1))*100);
  }

  private showToast(message: any){
      let toast = this.toastCtrl.create({
        message: (typeof message == 'string' )? message.substring(0,( message.indexOf('&#x') != -1? message.indexOf('&#x') : message.length)) : message.toString().substring(0,( message.toString().indexOf('&#x') != -1 ?message.toString().indexOf('&#x') : message.toString().length)) ,
        position: 'bottom',
        showCloseButton : true,
        duration: 2500
      });
      toast.present();
      toast.onDidDismiss((a,b)=>{
        this.backbuttonPressed = 0;
      })
  }

}
