import { Component, Inject } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { Http, Headers, RequestOptions  } from '@angular/http';
import { File } from '@ionic-native/file';
import { FileOpener } from '@ionic-native/file-opener';
import { Transfer, TransferObject } from '@ionic-native/transfer';

import * as mimes from 'mime-types';
import * as trans from 'transliteration.crh';

import * as consts from '../../utils/consts';
import { Localization } from '../../utils/localization';
import { Loader } from '../../utils/loader';

declare var cordova:any;

@Component({
  selector: 'page-policies',
  templateUrl: 'policies.html',
})
export class Policies {

  Docs : Array<any>;
  fileTransfer : TransferObject;
  title: string;
  guid:string;

  constructor(public navCtrl: NavController, public navParams: NavParams,private transfer: Transfer,private fileOpener: FileOpener, public file : File,public http : Http, @Inject(Loader) public loaderctrl: Loader, @Inject(Localization) public loc : Localization,public toastCtrl: ToastController) {
    this.title = navParams.data.title || loc.dic.modules.News;
    this.guid = navParams.data.guid;
    this.getDocuments();
    try{
      this.fileTransfer = this.transfer.create();
    }catch(e){console.error('<Policies> FileTransfer create error:',e)};
  }

  private getDocuments(loadNew?:boolean) : Promise<any> {
    let lastName = this.Docs && loadNew ? encodeURI(encodeURIComponent(this.Docs[this.Docs.length-1].FileLeafRef)) : false;
    let url = `${consts.siteUrl}/_api/web/lists('${this.guid}')/Items?${ lastName ? '$skiptoken=Paged=TRUE=p_FileLeafRef='+lastName+'&' : ''}$orderby=FileLeafRef+asc&$select=FileLeafRef,Title,Id,Created,UniqueId,FileRef&$top=10`;//Author,File_x005f_x0020_x005f_Type //$expand=FieldValuesAsText&
    
    let headers = new Headers({'Accept': 'application/json;odata=verbose','Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`});
    let options = new RequestOptions({ headers: headers ,withCredentials: true});

    return this.http.get(url,options).timeout(consts.timeoutDelay).retry(consts.retryCount).toPromise()
      .then(response=>{
          !loadNew && (this.Docs=[]);
          response.json().d.results.map( (item, i , arr) => {
            item.Created = (new Date(item.Created)).toLocaleString();
            item.icon = item.FileLeafRef.substring(item.FileLeafRef.lastIndexOf('.')+1,item.FileLeafRef.length);
            this.Docs.push(item);
        });
      })
      .catch(error=>{
        console.error('<Policies> getDocuments error:',error);
        this.Docs = [];
      })

  }

  public docClicked(doc) : void {
    let nativeURL = (cordova.file.documentsDirectory || cordova.file.externalDataDirectory || cordova.file.cacheDirectory );
    this.loaderctrl.presentLoading();
    
    doc.localName = this.getLocalName(doc.FileLeafRef);
    
    this.file.checkFile(nativeURL,doc.localName).then(
      data => {this.opendDocs(nativeURL+doc.localName,doc.localName)},
      error => {this.downloadDoc(nativeURL,doc)}
    )     
  }

  private downloadDoc(nativeURL : string, doc : any) : void {
    let url =`${consts.siteUrl}/_layouts/15/download.aspx?`+(doc.UniqueId? ('UniqueId='+doc.UniqueId ) : ('SourceUrl='+encodeURI(doc.FileRef)) );
    
    this.fileTransfer && this.fileTransfer.download(url, nativeURL + doc.localName,true,{headers:{'Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`}})
         .then(data=>{
            this.opendDocs(data.nativeURL,doc.localName);
         })
         .catch(err=>{
            console.log('<Policies> file transfer error',err);
            this.loaderctrl.stopLoading();
            this.showToast('Can`t download or save this file');
         })
  }

  public opendDocs(nativeURL,docName) : void {
    this.fileOpener.open(decodeURIComponent(nativeURL),mimes.lookup(decodeURIComponent(docName)))
      .then((data)=>{this.loaderctrl.stopLoading();})
      .catch(err=>{
        this.loaderctrl.stopLoading();
        console.log('<Policies> cant open file:',nativeURL)
        this.showToast('Can`t open this file');
      })
  }

  private getLocalName(name) : String {
    let newName : string = trans.crh.fromCyrillic(name.toLowerCase().replace(/ы/g,'u').replace(/ї/g,'i').replace(/я/g,'ya').replace(/ч/g,'ch').replace(/ь/g,'').replace(/ъ/g,'').replace(/ш/g,'sch').replace(/щ/g,'sch').replace(/ю/g,'u').replace(/є/g,'e'));
    newName = newName.toLowerCase().replace(/ /g,'_');
    return decodeURI(newName);
  }

  doInfinite(infiniteScroll){
    this.getDocuments(true)
      .then( () =>{
        infiniteScroll.complete();
      })
  }

  private showToast(message: any){
      let toast = this.toastCtrl.create({
        message: (typeof message == 'string' )? message : message.toString().substring(0,( message.toString().indexOf('&#x') || message.toString().length)) ,
        position: 'bottom',
        showCloseButton : true,
        duration: 9000
      });
      toast.present();
  }

}
