# Intranet
Mobile app for LSIntanet 

### to align apk (after signing)
 `cd ~/Library/Android/sdk/build-tools/26.0.0
 ./zipalign 4 ~/Projects/Intranet/platforms/android/build/outputs/apk/android-release-unaligned.apk ~/Projects/Intranet/platforms/android/build/outputs/apk/output.apk`

 ##TO DO 
 ~ Content Types of <News> and <Blogs>  are not the same
 ~ Image Src in <News> and <Blogs> are `hardcoded` (find dynamic method of identifining src od publishing image)