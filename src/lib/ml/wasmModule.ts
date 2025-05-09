import * as tf from '@tensorflow/tfjs';
import * as Comlink from 'comlink';

// WebAssembly module for optimized computations
const wasmModule = {
  async init() {
    // Initialize WASM backend
    await tf.setBackend('wasm');
    await tf.ready();
    
    return {
      // Matrix multiplication optimized with WASM
      matMul(a: Float32Array, b: Float32Array, shape: number[]): Float32Array {
        const tensor1 = tf.tensor(a, [shape[0], shape[1]]);
        const tensor2 = tf.tensor(b, [shape[1], shape[2]]);
        const result = tf.matMul(tensor1, tensor2);
        return new Float32Array(result.dataSync());
      },

      // Convolution operation optimized with WASM
      conv2d(input: Float32Array, kernel: Float32Array, inputShape: number[], kernelShape: number[]): Float32Array {
        const inputTensor = tf.tensor(input, inputShape);
        const kernelTensor = tf.tensor(kernel, kernelShape);
        const result = tf.conv2d(inputTensor, kernelTensor, 1, 'valid');
        return new Float32Array(result.dataSync());
      },

      // Activation functions
      relu(input: Float32Array): Float32Array {
        const tensor = tf.tensor(input);
        const result = tf.relu(tensor);
        return new Float32Array(result.dataSync());
      },

      sigmoid(input: Float32Array): Float32Array {
        const tensor = tf.tensor(input);
        const result = tf.sigmoid(tensor);
        return new Float32Array(result.dataSync());
      }
    };
  }
};

// Export using Comlink for Web Worker communication
Comlink.expose(wasmModule);

export type WasmModule = typeof wasmModule;