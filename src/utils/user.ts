import { Injectable , Inject } from '@angular/core';
import { Http, Headers, RequestOptions  } from '@angular/http';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/delay';
import * as consts from './consts';

@Injectable()
export class User{

   Id : number;
   email : string;
   locale : string;
   user : any;

   itemPropsLoaded : Promise<any>;

    constructor(@Inject(Http) public http: Http ){ 
      this.email = 'e@e';
      this.locale = 'en-gb';
      this.user = {};
      this.user.Title = 'Bob';
      this.itemPropsLoaded = Promise.resolve();
    }

    private getProps() : Promise<any> {
     let listGet = `${consts.siteUrl}/_api/Web/CurrentUser`;
     let localeGet = `${consts.siteUrl}/_api/SP.UserProfiles.PeopleManager/GetMyProperties/UserProfileProperties`;
     //authorization for OnPremise 'username:password' to base64
     let headers = new Headers({ 'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
     let options = new RequestOptions({ headers: headers });
   
     return Promise.all([this.http.get(listGet,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise(),this.http.get(localeGet,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()])
         .then( res => {
            this.user = res[0].json().d;
            this.email = this.user.Email;
            this.Id = this.user.Id;
            
            res[1].json().d.UserProfileProperties.results.some(item =>{
              if(item.Key ==('SPS-MUILanguages')){
                this.locale = item.Value.substring(item.Value.indexOf('-')+1,item.Value.length).toLowerCase();
                return true;
              }
            })
        
            return this.user;
         })
         .catch( error => {
           console.error('<User> Loading Props error!',error);
           throw new Object(error);
         })
   }

   public init(){
     return this.itemPropsLoaded = this.getProps();
   }

   public getUserProps() : Promise<any> {
      return this.itemPropsLoaded;
   }

   public getId(): number {
      return this.Id;
   }

   public getEmail() : string {
     return this.email;
   }

   public getUserName() : string {
     return this.user.Title;
   }

   //  private getLangDict() : Promise<any> {
     
  //    let path = cordova.file.dataDirectory;
  //    let file = "Dictionary.js"; 
  //    return File.checkFile(path,file).then(
  //       data => {return true},
  //       error => {return false}
  //     )
  //     .then((status)=>{return status? this.downloadDict(path+'/'+file) : Promise.resolve(true)});
  //  }

  //  private downloadDict(path : string) : Promise<any>{
  //     let url = `${consts.siteUrl}/LSSource/LS/Core/js/LSLangCustom.js`;
  //     return this.fileTransfer && this.fileTransfer.download(url,path,true,{headers:{'Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`}})
  //        .then(data=>{
  //           console.log('<User> file transfer success',data);
  //           return data;
  //        })
  //        .catch(err=>{
  //           console.error('<User> file transfer error',err);
  //        })
  //  }

}
