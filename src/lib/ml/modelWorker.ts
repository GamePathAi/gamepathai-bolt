import * as Comlink from 'comlink';
import * as tf from '@tensorflow/tfjs';
import type { WasmModule } from './wasmModule';

const modelWorker = {
  model: null as tf.LayersModel | null,
  wasmModule: null as any,

  async init(modelUrl: string) {
    // Initialize WASM module
    const wasmModuleUrl = new URL('./wasmModule', import.meta.url);
    const worker = new Worker(wasmModuleUrl, { type: 'module' });
    this.wasmModule = Comlink.wrap<WasmModule>(worker);
    await this.wasmModule.init();

    // Load model
    this.model = await tf.loadLayersModel(modelUrl);
    return true;
  },

  async predict(input: Float32Array, inputShape: number[]) {
    if (!this.model || !this.wasmModule) {
      throw new Error('Model or WASM module not initialized');
    }

    try {
      // Preprocess input using WASM
      const preprocessed = await this.wasmModule.relu(input);
      
      // Convert to tensor
      const tensor = tf.tensor(preprocessed, inputShape);
      
      // Run inference
      const prediction = this.model.predict(tensor) as tf.Tensor;
      
      // Post-process output
      const output = await this.wasmModule.sigmoid(new Float32Array(prediction.dataSync()));
      
      return output;
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }
};

Comlink.expose(modelWorker);

export type ModelWorker = typeof modelWorker;