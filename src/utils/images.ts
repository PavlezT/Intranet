import { Transfer, NativeStorage, File } from 'ionic-native';
import { Injectable } from '@angular/core';
import * as consts from './Consts';

declare var cordova:any;

@Injectable()
export class Images {

   images : any;
   fileTransfer :any;

   constructor() {
     this.images = {};
   }

   public _init() : void {
     try{
      this.fileTransfer = new Transfer();
     }catch(e){console.log('<Iamges> FileTransfer _initing error',e)};

      this.imagesLoad().then(res => {
        let first = res[Object.keys(res)[0]];
        if(first){
          File.checkFile(first.substring(0,first.lastIndexOf(`/`)+1),first.substring(first.lastIndexOf(`/`)+1,first.length)).then(
            data => {this.images = res;},
            error => {this.images = {};}
          )
        } else {
          this.images = {};
        }
      })
   }

   private imagesLoad() : Promise<any> {
      return NativeStorage.getItem('images').catch(err=>{console.log('<Images> imagesLoad error',err);return {};});
   }

   private saveImage() : Promise<any> {
      return NativeStorage.setItem('images',this.images).catch(err=>{console.log('<Images> error saving images',err)})
   }

   private loadImage(key : string) :  string {
      let listGet = `${consts.siteUrl}/_layouts/15/userphoto.aspx?size=S&accountname=${key}&mobile=0`;
      let endpointURI = cordova && cordova.file && cordova.file.dataDirectory ? cordova.file.dataDirectory : 'file:///android_asset/';
      
      try{
          this.images[key] = !consts.OnPremise ? (cordova.file.applicationDirectory + 'www/assets/icon/favicon.ico') : listGet;
      }catch(e){
          console.error('<Images> loadImage: this.image[key]= ',e);
          this.images[key] = listGet;
      }

      this.fileTransfer && this.fileTransfer.download(listGet,endpointURI+key+'.png',true,{headers:{'Content-Type':`image/png`,'Accept':`image/webp`,'Authorization':`Basic ${btoa(window.localStorage.getItem('username')+':'+window.localStorage.getItem('password'))}`}})
         .then(data=>{
            console.log('<Image> file transfer success',data);
            this.images[key] = data.nativeURL;
            this.saveImage();
         })
         .catch(err=>{
            console.error('<Images> file transfer error',err);
         })

      return this.images[key];
   }

   public getImage(key : string) : string {
       return this.images[key] || this.loadImage(key);
   }

}
