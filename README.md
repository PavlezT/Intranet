# Intranet
Mobile app for LSIntanet 

### to align apk (after signing)
 `cd ~/Library/Android/sdk/build-tools/26.0.0
 ./zipalign 4 ~/Projects/Intranet/platforms/android/build/outputs/apk/android-release-unaligned.apk ~/Projects/Intranet/platforms/android/build/outputs/apk/output.apk`

 ## TO DO 
 1. Content Types of *News* and *Blogs*  are not the same
 2. Image Src in *News* and *Blogs* are **hardcoded** (find dynamic method of identifining src od publishing image)

 ### add animation on SplashScreen
 * Android : 
 ```Java
    import android.view.animation.AccelerateInterpolator;
    // function showSplashScreen #line :300
    AlphaAnimation fadeIn = new AlphaAnimation(0, 1);
    fadeIn.setInterpolator(new AccelerateInterpolator((float)1.5));
    fadeIn.setDuration(2000);

    splashImageView.setAnimation(fadeIn);
    splashImageView.startAnimation(fadeIn);
```
