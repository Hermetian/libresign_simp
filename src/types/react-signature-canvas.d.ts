declare module 'react-signature-canvas' {
  import * as React from 'react';

  export interface SignatureCanvasProps {
    penColor?: string;
    backgroundColor?: string;
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
    minWidth?: number;
    maxWidth?: number;
    velocityFilterWeight?: number;
    dotSize?: number | (() => number);
    onBegin?: () => void;
    onEnd?: () => void;
  }

  export interface PointGroup {
    color: string;
    points: Array<{x: number; y: number; time: number; velocity: number}>;
  }

  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    fromDataURL(dataURL: string, options?: object): void;
    toDataURL(type?: string, encoderOptions?: number): string;
    fromData(pointGroups: PointGroup[]): void;
    toData(): PointGroup[];
  }
} 