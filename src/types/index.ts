// src/types/index.ts

export type Point = {
  x: number;
  y: number;
};

export type DocumentBounds = {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
};
