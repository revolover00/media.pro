declare module 'gifshot' {
  export interface GIFOptions {
    video?: string | string[] | HTMLVideoElement;
    images?: Array<string | Blob | HTMLImageElement | CanvasRenderingContext2D>;
    gifWidth?: number;
    gifHeight?: number;
    interval?: number;
    numFrames?: number;
    frameDuration?: number;
    sampleInterval?: number;
    numWorkers?: number;
    keepCameraOn?: boolean;
    progressCallback?: (captureProgress: number) => void;
    fontWeight?: string;
    fontSize?: string;
    fontFamily?: string;
    fontColor?: string;
    textAlign?: string;
    textBaseline?: string;
    text?: string;
  }

  export interface GIFResult {
    error: boolean;
    errorCode: string;
    errorMsg: string;
    image: string;
  }

  export function createGIF(
    options: GIFOptions,
    callback: (obj: GIFResult) => void
  ): void;
}

declare module 'gifuct-js' {
  export function parseGIF(buffer: ArrayBuffer): any;
  export function decompressFrames(parsedGif: any, buildImages: boolean): any[];
}
