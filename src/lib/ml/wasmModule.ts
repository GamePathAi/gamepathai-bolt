import * as tf from '@tensorflow/tfjs';
import * as Comlink from 'comlink';

const wasmModule = {
  async init() {
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
      },

      // Performance optimization functions
      async optimizeComputation(data: Float32Array, operations: string[]): Promise<Float32Array> {
        let result = tf.tensor(data);
        
        for (const op of operations) {
          switch (op) {
            case 'relu':
              result = tf.relu(result);
              break;
            case 'sigmoid':
              result = tf.sigmoid(result);
              break;
            case 'tanh':
              result = tf.tanh(result);
              break;
            default:
              break;
          }
        }
        
        return new Float32Array(result.dataSync());
      },

      // Batch processing optimization
      async processBatch(batch: Float32Array[], batchSize: number): Promise<Float32Array[]> {
        const results: Float32Array[] = [];
        
        for (let i = 0; i < batch.length; i += batchSize) {
          const currentBatch = batch.slice(i, i + batchSize);
          const tensors = currentBatch.map(data => tf.tensor(data));
          const processed = await Promise.all(tensors.map(t => t.data()));
          results.push(...processed.map(d => new Float32Array(d)));
        }
        
        return results;
      }
    };
  }
};

Comlink.expose(wasmModule);

export type WasmModule = typeof wasmModule;