import { Component, ViewChild, OnInit, AfterViewInit, EventEmitter } from '@angular/core';
import { Platform, ToastController } from '@ionic/angular';
import * as tf from '@tensorflow/tfjs';
import { Base64ToGallery, Base64ToGalleryOptions } from '@ionic-native/base64-to-gallery/ngx';

const pathToModel = '/assets/model.json';


@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements AfterViewInit {
  public header = 'Predict Number';
  public predictedNumber: string;
  public loading: boolean;
  private model: any;
  private predictions: any;
  public rnum: any;

  

  @ViewChild('imageCanvas', { static: false }) canvas: any;
  canvasElement: any;
  saveX: number;
  saveY: number;
 
  selectedColor = '#9e2956';
  colors = [ '#9e2956', '#c2281d', '#de722f', '#edbf4c', '#5db37e', '#459cde', '#4250ad', '#802fa3' ];
 
  drawing = false;
  lineWidth = 5;
 
  newImage = new EventEmitter();

  constructor(private plt: Platform, private base64ToGallery: Base64ToGallery, private toastCtrl: ToastController) {}
  
  async loadModel() {
    this.loading = true;
    this.model = await tf.loadLayersModel(pathToModel);
    this.loading = false;
  }

  ngOnInit() {
    this.loadModel();
    console.log("Model Loaded")
  }

  ngAfterViewInit() {
    // Set the Canvas Element and its size
    this.canvasElement = this.canvas.nativeElement;
    this.canvasElement.width = this.plt.width() + '';
    this.canvasElement.height = 200;
    this.getRandomArbitrary(0,9);
  }
 

  getRandomArbitrary(min, max) {
    this.rnum = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(this.rnum)
}



  startDrawing(ev) {
    this.drawing = true;
    var canvasPosition = this.canvasElement.getBoundingClientRect();
 
    this.saveX = ev.touches[0].pageX - canvasPosition.x;
    this.saveY = ev.touches[0].pageY - canvasPosition.y;
  }
 
  endDrawing() {
    this.drawing = false;
    this.newImage.emit(this.getImgData());

  }
 
  selectColor(color) {
    this.selectedColor = color;
  }
 
  setBackground() {
    var background = new Image();
    background.src = './assets/code.png';
    let ctx = this.canvasElement.getContext('2d');
 
    background.onload = () => {
      ctx.drawImage(background,0,0, this.canvasElement.width, this.canvasElement.height);   
    }
  }

  moved(ev) {
    if (!this.drawing) return;
   
    var canvasPosition = this.canvasElement.getBoundingClientRect();
    let ctx = this.canvasElement.getContext('2d');
   
    let currentX = ev.touches[0].pageX - canvasPosition.x;
    let currentY = ev.touches[0].pageY - canvasPosition.y;
   
    ctx.lineJoin = 'round';
    ctx.strokeStyle = this.selectedColor;
    ctx.lineWidth = this.lineWidth;
   
    ctx.beginPath();
    ctx.moveTo(this.saveX, this.saveY);
    ctx.lineTo(currentX, currentY);
    ctx.closePath();
   
    ctx.stroke();
   
    this.saveX = currentX;
    this.saveY = currentY;
    
  }
  
  exportCanvasImage() {
    var dataUrl = this.canvasElement.toDataURL();
   
    // Clear the current canvas
    let ctx = this.canvasElement.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
   
   
    if (this.plt.is('cordova')) {
      const options: Base64ToGalleryOptions = { prefix: 'canvas_', mediaScanner:  true };
   
      this.base64ToGallery.base64ToGallery(dataUrl, options).then(
        async res => {
          const toast = await this.toastCtrl.create({
            message: 'Image saved to camera roll.',
            duration: 2000
          });
          toast.present();
        },
        err => console.log('Error saving image to gallery ', err)
      );
    } else {
      // Fallback for Desktop
      var data = dataUrl.split(',')[1];
      let blob = this.b64toBlob(data, 'image/png');
   
      var a = window.document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = 'canvasimage.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
   
  // https://forum.ionicframework.com/t/save-base64-encoded-image-to-specific-filepath/96180/3
  b64toBlob(b64Data, contentType) {
    contentType = contentType || '';
    var sliceSize = 512;
    var byteCharacters = atob(b64Data);
    var byteArrays = [];
   
    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);
   
      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
   
      var byteArray = new Uint8Array(byteNumbers);
   
      byteArrays.push(byteArray);
    }
   
    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  pixelsToShape(imageData) {
    let img = tf.browser.fromPixels(imageData, 1);
    // @ts-ignore
    img = img.reshape([1, 28, 28, 1]);
    console.log(img.shape)
    return tf.cast(img, 'float32');
  }

  getIndexMaxValue() {
    let indexMaxValue = 0;

    for (let i = 0; i < this.predictions.length; i++) {
      if (this.predictions[i] > this.predictions[indexMaxValue]) {
        indexMaxValue = i;
      }
    }
    return `${indexMaxValue}`;
  }

  getImgData(): ImageData {
    let ctx = this.canvasElement.getContext('2d');
    const scaled = ctx.drawImage(this.canvasElement, 0, 0, 28, 28);
    var test_img = ctx.getImageData(0, 0, 28, 28)
    console.log(test_img)
    const img = this.pixelsToShape(test_img);
    this.predictions = Array.from(this.model.predict(img).dataSync());
    this.predictedNumber = this.getIndexMaxValue();
    return test_img;
  }

  async predict(imageData: ImageData) {
    await tf.tidy(() => {
      const img = this.pixelsToShape(imageData);
      this.predictions = Array.from(this.model.predict(img).dataSync());
      this.predictedNumber = this.getIndexMaxValue();

    });
  }
    clear() {
      let ctx = this.canvasElement.getContext('2d');
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      this.predictedNumber = '';
    }


}
