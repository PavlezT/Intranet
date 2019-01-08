import { Http, Headers, RequestOptions  } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Injectable, Inject } from '@angular/core';
import { NativeStorage } from '@ionic-native/native-storage';
import { Device } from '@ionic-native/device';
import { File } from '@ionic-native/file';
import * as consts from './consts';

declare var cordova:any;

@Injectable()
export class Auth {
   url : string;
   options: { username : string, password : string};
   http: Http;

   constructor(@Inject(Http) http: Http, public file : File, public device: Device, public nativeStorage: NativeStorage){
      this.http = http;
   }

   public init(url:string, options:{username:string,password:string}){
      this.url = url;
      this.options = options;
      window.localStorage.setItem('OnPremise',(url.indexOf('.sharepoint.com/') == -1 ? 'true' : ''));
      this.options.username = this.options.username
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
      this.options.password = this.options.password
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
   }

   saveUserCredentials(): void{
      if(window.localStorage.getItem('OnPremise')){
         window.localStorage.setItem('username',this.options.username);
         window.localStorage.setItem('password',this.options.password);
      }
      this.nativeStorage.setItem('user',{username:this.options.username,password: this.options.password})
      .then(
         //()=>{
         // Promise.all([this.secureStorage.set('username', 'ddd'),
         //             this.secureStorage.set('password','pppp')])//this.options.password
         //  .then(
            data => console.log('<Auth> User credentials data saved'),
            error => { console.error('<Auth> Error setting credentials in storage',error);}
            //throw new Error('<Auth> Saving user credentials data:'+ error.message)}
      //   );
   //   }
      )
   }

   checkAuthActive(host :string){
      host = host.substring(0,host.indexOf('/sites/'));
      let now = new Date();
      let expiredOn = new Date(window.localStorage.getItem(host));

      if (!expiredOn || now > expiredOn) {
            window.localStorage.removeItem(host);
            return false;
        }
      return true;
   }

   checkAuthAlready(){
      let host = window.localStorage.getItem('siteUrl');
      if(!host) return false;
      consts.setUrl(host);
      host = host.substring(0,host.indexOf('/sites/'));
      let expiry= window.localStorage.getItem(host);
      if(expiry)
         return true;
      return false;
   }

   setCookieExpiry(host : string, expiry : Date){
      window.localStorage.setItem(host , expiry.toString());
      this.saveUserCredentials();
   }

   getAuth(): any{
      let self = this;
      let host = self.url.substring(0,self.url.indexOf('/sites/'));

      return (!window.localStorage.getItem('OnPremise') ?  this.getTokenWithOnline().then( (res : string) => {return this.XmlParse(res)})
                                                          .then( tokenResponse => {
                                                              return self.postToken(tokenResponse)
                                                           })
                                            : this.checkOnPremise())
                                                   .then( response => {
                                                      let diffSeconds = response[0];
                                                      let now = new Date();
                                                      now.setSeconds(now.getSeconds() + diffSeconds);

                                                      let authPage : string = (response[1] && response[1].text) ? response[1].text() : " ";
                                                      if(authPage.includes('Correlation ID:') || authPage.includes('<div id="errordisplay-mainDiv">'))
                                                        throw new Error(`Error in login user in sharepoint:${authPage.slice( authPage.indexOf('id="errordisplay-IssueTypeValue">')+'id="errordisplay-IssueTypeValue">'.length,authPage.lastIndexOf('</span>') )}`)

                                                      self.setCookieExpiry(host, now);
                                                      return true;
                                                   })
                                                   .catch(error => {
                                                      throw new Error(error.message || error);
                                                   })
     }

  private checkOnPremise() : Promise<any> {
    return this.http.get(consts.siteUrl).toPromise()
      .then(()=>{return [60*60*24*365,{}]})
      .catch(err=>{
        console.log('<Auth> error checking onPremise:',err);
        throw new Error('Url is invalid or site is unreachable.')
      });
  }

   public XmlParse(res) : Object {
      if(res.includes('<S:Fault>') || res.startsWith('Error')){
         let reason = res.substring(res.indexOf('<S:Detail>'),res.indexOf('</S:Detail>'));
         reason = reason.substring(reason.indexOf('<psf:text>') + '<psf:text>'.length,reason.indexOf('</psf:text>'));
         console.error(`<Auth> Fail in loggin: ${reason}`);
         throw new Error(`Fail in loggin!\n The email or password you entered is incorrect.`);//${reason}
      } else {
			let token = res.substring(res.indexOf('<wsse:BinarySecurityToken') + '<wsse:BinarySecurityToken'.length, res.indexOf('</wsse:BinarySecurityToken>'));
			token = token.substring(token.indexOf('>t=') + '>'.length, token.length);
         let expires = res.substring(res.indexOf('<wst:Lifetime>'),res.indexOf('</wst:Lifetime>'));
         expires = expires.substring(expires.indexOf('<wsu:Expires>') + '<wsu:Expires>'.length,expires.indexOf('</wsu:Expires>'));
         return {
              token : token,
              expires : expires
         };
      }
   }

   public getTokenWithOnline(): Promise<any> {
        let self = this;
        let host = self.url.substring(0,self.url.indexOf('/sites/'));
        let spFormsEndPoint =  host + "/" + consts.FormsPath;

        if(!host.includes('https://'))
          return Promise.reject("The URL should support the HTTPS protocol.");

        return self.readFile(consts.Online_saml_path ,consts.Online_saml)
               .then( (text:string) => {
                  let samlBody = text.replace('<%= username %>',self.options.username).replace('<%= password %>',self.options.password).replace('<%= endpoint %>',spFormsEndPoint);
                  let url = consts.MSOnlineSts;

                  let headers = new Headers({'Content-Type': 'application/soap+xml; charset=utf-8'});
                  let options = new RequestOptions({ headers: headers });

                  return self.http.post(url,samlBody,options).timeout(consts.timeoutDelay).retry(consts.retryCount)
                     .toPromise()
               })
               .then( response => {
                  return response.text()
               })
               .catch( error => {
                  throw new Error(`Error in posting XML to loginmicrosoft:\n${JSON.stringify(error)}`);
               })
    }

   public readFile(path,filename):Promise <any>{
      if(this.device.uuid)//this is device
         return this.file.readAsText(cordova.file.applicationDirectory + path,filename).catch(error=>{throw new Error('Read SAML file error!');})
      else if(filename.includes('online_saml.tmpl')){
         console.log('In browser reading file');
         return Promise.resolve(`<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
           <s:Header>
             <a:Action s:mustUnderstand="1">http://schemas.xmlsoap.org/ws/2005/02/trust/RST/Issue</a:Action>
             <a:ReplyTo>
               <a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address>
             </a:ReplyTo>
             <a:To s:mustUnderstand="1">https://login.microsoftonline.com/extSTS.srf</a:To>
             <o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
               <o:UsernameToken>
                 <o:Username><%= username %></o:Username>
                 <o:Password><%= password %></o:Password>
               </o:UsernameToken>
             </o:Security>
           </s:Header>
           <s:Body>
             <t:RequestSecurityToken xmlns:t="http://schemas.xmlsoap.org/ws/2005/02/trust">
               <wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy">
                 <a:EndpointReference>
                   <a:Address><%= endpoint %></a:Address>
                 </a:EndpointReference>
               </wsp:AppliesTo>
               <t:KeyType>http://schemas.xmlsoap.org/ws/2005/05/identity/NoProofKey</t:KeyType>
               <t:RequestType>http://schemas.xmlsoap.org/ws/2005/02/trust/Issue</t:RequestType>
               <t:TokenType>urn:oasis:names:tc:SAML:1.0:assertion</t:TokenType>
             </t:RequestSecurityToken>
           </s:Body>
         </s:Envelope>
         `)
      }
    }

   public postToken(tokenResponse):Promise <any>{
       let self = this;
       let host = self.url.substring(0,self.url.indexOf('/sites/'));
       let spFormsEndPoint =  host + "/" + consts.FormsPath;
       let now = new Date().getTime();
       let expires = new Date(tokenResponse.expires).getTime();
       let diff = (expires - now) / 1000;
       let diffSeconds = parseInt(diff.toString(), 10);

       let headers = new Headers({'Content-Type': 'application/x-www-form-urlencoded'});
       let options = new RequestOptions({ headers: headers });

       return  Promise.all([diffSeconds,self.http.post(spFormsEndPoint,tokenResponse.token,options).timeout(consts.timeoutDelay+10000).retry(consts.retryCount+3)
        .toPromise()])
   }

}
