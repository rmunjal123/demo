import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController } from '@ionic/angular'
import * as tf from '@tensorflow/tfjs';
import { DrawableDirective } from 'D:/MLProject/visionapp/src/app/directives/drawable.directive';


const pathToModel = '/assets/model.json';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
})
export class Tab1Page implements OnInit {
  public header = 'Predict Number';
  public predictedNumber: string;
  public loading: boolean;
  private model: any;
  private predictions: any;

  @ViewChild(DrawableDirective) canvas;

  constructor(public nav: NavController) {}

  ngOnInit() {
    this.loadModel();
  }

  private pixelsToShape(imageData) {
    let img = tf.browser.fromPixels(imageData, 1);
    // @ts-ignore
    img = img.reshape([1, 28, 28, 1]);
    return tf.cast(img, 'float32');
  }

  private getIndexMaxValue() {
    let indexMaxValue = 0;

    for (let i = 0; i < this.predictions.length; i++) {
      if (this.predictions[i] > this.predictions[indexMaxValue]) {
        indexMaxValue = i;
      }
    }
    return `${indexMaxValue}`;
  }

  async loadModel() {
    this.loading = true;
    this.model = await tf.loadLayersModel(pathToModel);
    this.loading = false;
  }

  async predict(imageData: ImageData) {
    await tf.tidy(() => {
      const img = this.pixelsToShape(imageData);
      this.predictions = Array.from(this.model.predict(img).dataSync());
      this.predictedNumber = this.getIndexMaxValue();
    });
  }

  clear() {
    this.canvas.clear();
    this.predictedNumber = '';
  }
}
