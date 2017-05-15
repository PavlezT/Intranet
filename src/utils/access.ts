import { Http, Headers, RequestOptions  } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Injectable, Inject } from '@angular/core';
import * as consts from './Consts';

@Injectable()
export class Access{

    private digest : string;
    private digest_expiry : string;
    private access_token : string;
    private access_expiry : string;

    constructor(@Inject(Http) public http: Http){

    }

    public _init() : void {
        (consts.OnPremise ? Promise.resolve() :  this.getAccessToken() ).then(()=>{
            this.getDigest();
        });
        //this.getAccessTokenOnPremise().then(token=>{console.log('token',token)});
    }

    private getDigest() : Promise<any> {
        let listGet = `${consts.siteUrl}/_api/contextinfo`;

        let headers = new Headers({'Authorization':(consts.OnPremise?`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`:`Bearer ${this.access_token}`),'Accept':"application/json; odata=verbose",'Content-Type': 'application/x-www-form-urlencoded'});
        let options = new RequestOptions({ headers: headers });

        return this.http.post(listGet,{},options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
            .then(response=>{
                let res = response.json().d.GetContextWebInformation
                this.digest = res.FormDigestValue;
                this.digest_expiry = (new Date(Date.now() + res.FormDigestTimeoutSeconds*1000)).toJSON();
            })
            .catch( err =>{
                console.log('<Access> getDigest error',err);
                if(err.status == '500' && !consts.OnPremise){
                    return this.getAccessToken().then(()=>{ return this.getDigest()});
                }
                return {FormDigestValue:''};
            })
    }

    private getAccessToken() : Promise<any>{
        let url = `https://accounts.accesscontrol.windows.net/${consts.site_realm}/tokens/OAuth/2`;

        let headers = new Headers({'Content-Type': 'application/x-www-form-urlencoded'});
        let options = new RequestOptions({ headers: headers });

        let data = `grant_type=client_credentials&
            client_id=${consts.client_id}@${consts.site_realm}&
            client_secret=${encodeURIComponent(consts.secret)}&
            resource=${consts.resource}/${consts.siteUrl.substring('https://'.length,consts.siteUrl.indexOf('/sites'))}@${consts.site_realm}`

        return this.http.post(url,data,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
            .then(response=> {
                let res = response.json();
                this.access_token = res.access_token;
                this.access_expiry = (new Date(Date.now() + res.expires_in*1000)).toJSON();
            })
            .catch(err=> {
                console.log('<Access> getAccessToken error',err);
            })
    }

    public getToken() : Promise<string> {
        return ((new Date(this.access_expiry)) <= (new Date())) && !consts.OnPremise ? this.getAccessToken().then(()=>{return this.access_token}) : Promise.resolve(consts.OnPremise?consts.access_tokenOnPremise :this.access_token);
    }

    public getDigestValue() : Promise<string> {
        return ((new Date(this.digest_expiry)) <= (new Date())) ? this.getDigest().then(()=>{return this.digest}) : Promise.resolve(this.digest);
    }

   //  public getAccessTokenOnPremise() : Promise<any> {
   //    let sharepointhostname: string = consts.siteUrl.substring(0,consts.siteUrl.indexOf('/sites/'));
   //    let audience: string = `${consts.resource}/${sharepointhostname}@${consts.site_realm}`;
   //    let fullIssuerIdentifier: string = `${consts.isser_id}@${consts.site_realm}`;
    //
   //    let options: any = {
   //      key: File.readAsText(cordova.file.applicationDirectory + consts.OnPremise_keyPath,consts.Key)
   //      .then(data=>{console.log('key data',data);return data;})
   //    };
    //
   //    let dateref: number = parseInt(((new Date()).getTime() / 1000).toString(), 10);
    //
   //    let rs256: any = {
   //      typ: 'JWT',
   //      alg: 'RS256',
   //      x5t: consts.shaThumbprint
   //    };
    //
   //    let actortoken: any = {
   //      aud: audience,
   //      iss: fullIssuerIdentifier,
   //      nameid: consts.client_id + '@' + consts.site_realm,
   //      nbf: (dateref - 12*60*60).toString(),
   //      exp: (dateref + 12*60*60).toString(),
   //      trustedfordelegation: true
   //    };
    //
   //    let accessToken: string;
   //    console.log('options.ky',options.key)
   //    // return this.http.get(consts.siteUrl+'/_api/web/lists?$top=2',new RequestOptions({headers: new Headers({
   //    //    'Accept':'application/json;odata=verbose',
   //    //    'Authorization':'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsIng1dCI6IjNGTnRlaTBOZlg5UHl6SFJ4d1hlS250b21jWSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbHNkb2NzLmV4dDUubGl6YXJkLm5ldC51YUAxYTgxMWIyMi04YjJlLTQ1M2MtODE5MS0wYmJjMDM3MWRlOGEiLCJpc3MiOiI5ZTllNDZjNC02MzI5LTQ5OTAtYTBiOC0xM2I4N2IzYmE1NmFAMWE4MTFiMjItOGIyZS00NTNjLTgxOTEtMGJiYzAzNzFkZThhIiwibmFtZWlkIjoiMDQyYTNjYjQtYzE0MC00NDU1LWFiMmYtZTQ2ZjE0OTMxMWRjQDFhODExYjIyLThiMmUtNDUzYy04MTkxLTBiYmMwMzcxZGU4YSIsIm5iZiI6IjE0ODc4MDU0NjkiLCJleHAiOiIxNDg3ODkxODY5IiwidHJ1c3RlZGZvcmRlbGVnYXRpb24iOnRydWUsImlhdCI6MTQ4Nzg0ODY2OX0.Lzpheh4MsrKCdxjX9pf2bXZYmn27Y11pX5IVL2H3l20xMkTU5vPT2jLV9uc2e-X5QeSnMa01IdydYYJVUZSXenJXvO65fOhoCY67iFVJiVxP1ixDW1k8-nGVhAEOscpocjn5CDTkC019Vfu0r2stZnWWPiq4ivEqOaa0m2KEYLkwYQ1bRXrIfqDc5PJOfWibX27BX5G1kb63f65Ee87nmuhBSKgES-8MTM55BRWpxXVB07u5v3DkX2Ov91w3MqjeXCV0Rsvq4IMgh6RSxLuULXu6EpSZQhs302IBkDAX4DosFpXPKmNqQPMR4omdRsMx3XYpD4KvuzcpS9r7SDWh8-TLd6jCwQ2sBGA_fZq_mV1I4wznaYC8oJ2Zs2U8mUsdGqKFIEReekIUnMGsJO3r27Ht_UCTXha1D7U-MwnDCi0R4BIeWRuBbSvRnKl7is0guY5m2zZCd1iugM0P7GMKEKxwkM2h65sj0RSuCnPs6LDDoc4kIdP7iwKXMr3XYblhARiEF4KXiGXzOlMmO-oAJErUq0_d1CbDuUk5hkfJHoAa2E79bgjrXYAE9u3KpTHwvhW32-UMhtb1oQAAxzpRrU7rPdOWCiGNgR0XRKxZBNEv9VRTJGfnGMiREYl_4khuJsjLJlpKHrRz4WbfmmaPgErfdSNaefoPUaEQZxMG2qo'
   //    // })})).toPromise();
   //    return options.key.then(key=>{
   //       //accessToken = jwt.sign(actortoken, key, { header: rs256 },function(data,signature,kyky){console.log('data',data);console.log('signature',signature);console.log('kyky',kyky)});
   //       return accessToken;
   //    })
    //
   //  }
}
