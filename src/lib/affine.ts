/**
 * 2D affine transform: solves and applies a mapping from 3 anchor point pairs.
 *
 * Transform:  x' = a*x + b*y + c
 *             y' = d*x + e*y + f
 *
 * Given 3 source→target pairs we solve for [a,b,c,d,e,f].
 */

export type Point2D = { x: number; y: number };

export interface AffineTransform {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/**
 * Solve the affine transform from 3 source→target point pairs.
 * Throws if the source points are collinear (degenerate).
 */
export function solveAffine(
  src: [Point2D, Point2D, Point2D],
  dst: [Point2D, Point2D, Point2D]
): AffineTransform {
  const [s0, s1, s2] = src;
  const [d0, d1, d2] = dst;

  // Solve 3×3 system for x-transform: [a, b, c]
  // s0.x * a + s0.y * b + c = d0.x
  // s1.x * a + s1.y * b + c = d1.x
  // s2.x * a + s2.y * b + c = d2.x

  const det =
    s0.x * (s1.y - s2.y) - s0.y * (s1.x - s2.x) + (s1.x * s2.y - s2.x * s1.y);

  if (Math.abs(det) < 1e-10) {
    throw new Error("Anchor points are collinear — pick 3 non-collinear points");
  }

  const invDet = 1 / det;

  // Cramer's rule for x-coefficients
  const a =
    (d0.x * (s1.y - s2.y) - s0.y * (d1.x - d2.x) + (d1.x * s2.y - d2.x * s1.y)) *
    invDet;
  const b =
    (s0.x * (d1.x - d2.x) - d0.x * (s1.x - s2.x) + (s1.x * d2.x - s2.x * d1.x)) *
    invDet;
  const c =
    (s0.x * (s1.y * d2.x - s2.y * d1.x) -
      s0.y * (s1.x * d2.x - s2.x * d1.x) +
      d0.x * (s1.x * s2.y - s2.x * s1.y)) *
    invDet;

  // Same for y-coefficients
  const d =
    (d0.y * (s1.y - s2.y) - s0.y * (d1.y - d2.y) + (d1.y * s2.y - d2.y * s1.y)) *
    invDet;
  const e =
    (s0.x * (d1.y - d2.y) - d0.y * (s1.x - s2.x) + (s1.x * d2.y - s2.x * d1.y)) *
    invDet;
  const f =
    (s0.x * (s1.y * d2.y - s2.y * d1.y) -
      s0.y * (s1.x * d2.y - s2.x * d1.y) +
      d0.y * (s1.x * s2.y - s2.x * s1.y)) *
    invDet;

  return { a, b, c, d, e, f };
}

/** Apply an affine transform to a point. */
export function applyAffine(t: AffineTransform, p: Point2D): Point2D {
  return {
    x: t.a * p.x + t.b * p.y + t.c,
    y: t.d * p.x + t.e * p.y + t.f,
  };
}

/** Invert an affine transform. */
export function invertAffine(t: AffineTransform): AffineTransform {
  // The 2×2 linear part is [[a,b],[d,e]], translation is [c,f]
  const det = t.a * t.e - t.b * t.d;
  if (Math.abs(det) < 1e-10) {
    throw new Error("Transform is not invertible");
  }
  const invDet = 1 / det;
  const a = t.e * invDet;
  const b = -t.b * invDet;
  const d = -t.d * invDet;
  const e = t.a * invDet;
  const c = -(a * t.c + b * t.f);
  const f = -(d * t.c + e * t.f);
  return { a, b, c, d, e, f };
}
