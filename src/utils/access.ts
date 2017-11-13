import { Http, Headers, RequestOptions  } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Injectable, Inject } from '@angular/core';
import * as consts from './consts';
import * as jwt from 'jwt-decode';

@Injectable()
export class Access{

    private digest : string;
    private digest_expiry : string;
    private access_token : string;
    private access_expiry : string;
    private r_token : string;
    private site_realm : string;
    private inited : Promise<any>;
    private ready : any;
    private errorcount : number;

    constructor(@Inject(Http) public http: Http){
        this.errorcount  = 0;
        this.inited = this.getNewPromise();
    }

    public getNewPromise() : Promise<any>{
        return new Promise((resolve,reject)=>{
            this.ready = new Promise((res,rej)=>{
                res(resolve);
            })
        });
    }

    public _init() : void {
        this.access_expiry &&  (this.inited = this.getNewPromise()) && delete this.access_expiry && delete this.digest_expiry;
        (window.localStorage.getItem('OnPremise') ? Promise.resolve() :  this.getSiteRealm().then(()=>{ return this.getContextToken()}).then(()=>{return this.getAccessToken()}) ).then(()=>{
            this.getDigest().then(()=>this.ready.then(resolve=>resolve()));
        });
    }

    private getDigest() : Promise<any> {
        let listGet = `${consts.siteUrl}/_api/contextinfo`;

        let headers = new Headers({'Authorization':(window.localStorage.getItem('OnPremise')?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),'Accept':"application/json; odata=verbose",'Content-Type': 'application/x-www-form-urlencoded'});
        let options = new RequestOptions({ headers: headers });

        return this.http.post(listGet,{},options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
            .then(response=>{
                let res = response.json().d.GetContextWebInformation
                this.digest = res.FormDigestValue;
                this.digest_expiry = (new Date(Date.now() + res.FormDigestTimeoutSeconds*1000)).toJSON();
            })
            .catch( err =>{
                console.log('<Access> getDigest error',err);
                if((err.status == '500' || err.status == '400' ) && !window.localStorage.getItem('OnPremise')){
                    this.errorcount ++;
                    return this.errorcount < 4 ? this.getAccessToken().then(()=>{ return this.getDigest()}) : Promise.reject(`Unexpected ${err.status} error`);
                }
                return {FormDigestValue:''};
            })
    }
    
    private getSiteRealm() : Promise<any>{
        let domen = consts.siteUrl.substring('https://'.length,consts.siteUrl.indexOf('.sharepoint.'));
        let urlAuth = `https://login.microsoftonline.com/${domen}.onmicrosoft.com/.well-known/openid-configuration`;
        
        let headers = new Headers({'Accept': 'application/json;odata=verbose'});
        let options = new RequestOptions({ headers: headers });

        return this.http.get(urlAuth,options).timeout(consts.timeoutDelay+1000).retry(consts.retryCount+2).toPromise()
            .then(data=>{
                let text = data.json().issuer;
                this.site_realm = text.substring("https://sts.windows.net/".length,text.length-1);
            })
            .catch(error=>{console.error('<Access> getSiteRealm error:',error)})
    }

    private getContextToken() : Promise<any>{
        let urlAuth = `${consts.siteUrl}/_layouts/15/appredirect.aspx?client_id=${consts.client_id}&redirect_uri=${consts.redirect_uri}`;//.substring(0,consts.siteUrl.indexOf('/sites'))

        let headers = new Headers({'Accept': 'application/json;odata=verbose'});
        let options = new RequestOptions({ headers: headers ,withCredentials: true});

        return this.http.get(urlAuth,options).timeout(consts.timeoutDelay+1000).retry(consts.retryCount+2).toPromise()
            .then(data=>{
                let text = data.text();
                let tokeninput = text.substring(text.indexOf('name="SPAppToken"'),text.length);
                let token = tokeninput.substring(tokeninput.indexOf(`value="`)+`value="`.length,tokeninput.indexOf('" />'));
                if(!token || token.length == 0)
                    return Promise.reject('Invalid Context token!');
                this.r_token = jwt(token).refreshtoken;
            })
            .catch(error=>{console.error('<Access> getContextToken error:',error)})
    }

    private getAccessToken() : Promise<any>{
        let url = `https://accounts.accesscontrol.windows.net/${this.site_realm}/tokens/OAuth/2`;

        let body = `grant_type=refresh_token&
                client_id=${consts.client_id}@${this.site_realm}&
                client_secret=${encodeURIComponent(consts.secret)}&
                resource=${consts.resource}/${consts.siteUrl.substring('https://'.length,consts.siteUrl.indexOf('/sites'))}@${this.site_realm}&
                refresh_token=${this.r_token}`

        let headers = new Headers({'Accept': 'application/json;odata=verbose','Content-Type':'application/x-www-form-urlencoded'});
        let options = new RequestOptions({ headers: headers ,withCredentials: true});

        return this.http.post(url,body,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
            .then(response=>{
                let res = response.json();
                this.access_token = res.access_token;
                this.access_expiry = (new Date(Date.now() + res.expires_in*1000)).toJSON();
            })
            .catch(error=>{console.log('<Access> getAccessToken error:',error)})
    }

    public getToken() : Promise<string> {
        return (this.access_expiry && (new Date(this.access_expiry)) <= (new Date(Date.now()))) && !window.localStorage.getItem('OnPremise') ?  this.getAccessToken().then((access)=>{ return this.access_token }) : this.inited.then(()=>{ return Promise.resolve(window.localStorage.getItem('OnPremise')?consts.access_tokenOnPremise :this.access_token)});
    }

    public getDigestValue() : Promise<string> {
        return (this.digest_expiry && (new Date(this.digest_expiry)) <= (new Date(Date.now()))) ? this.getDigest().then(()=>{return this.digest}) :  this.inited.then(()=>{return (this.digest) });
    }

}
