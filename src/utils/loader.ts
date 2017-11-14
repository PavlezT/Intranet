import { Injectable,Inject } from '@angular/core';
import { LoadingController, Loading } from 'ionic-angular';
import { Localization } from './localization';

@Injectable()
export class Loader {
    loader : Loading;
    calls : Array<number>;

    constructor(public loadingCtrl: LoadingController,@Inject(Localization) public loc : Localization){
        this.calls =[];
    }

    presentLoading() : Promise<any> {
      this.calls.push(1);

      if(this.calls.length>1){return Promise.resolve();};

      this.loader = this.loadingCtrl.create({
        content: this.loc.dic.mobile.Wait,
      });

      return this.loader.present();
   }

   stopLoading() : Promise<any> {
    setTimeout(()=>{      
      this.calls.pop();
      if(this.calls.length==0){
        try{
          this.loader.dismiss();
        }catch(e){
          console.log('<Loader> error in loader:',e);
          console.log('<Loader> this.loader:',this.loader);
        }
      }
    },300);
    return Promise.resolve();
  }

}
