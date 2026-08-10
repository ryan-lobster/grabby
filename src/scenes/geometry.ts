import * as THREE from 'three'

/** A rounded rectangle centred on the origin, in the XY plane. */
export function roundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const w = width / 2
  const h = height / 2
  const r = Math.min(radius, w, h)
  const shape = new THREE.Shape()

  shape.moveTo(-w + r, -h)
  shape.lineTo(w - r, -h)
  shape.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false)
  shape.lineTo(w, h - r)
  shape.absarc(w - r, h - r, r, 0, Math.PI / 2, false)
  shape.lineTo(-w + r, h)
  shape.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false)
  shape.lineTo(-w, -h + r)
  shape.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false)
  shape.closePath()

  return shape
}

/**
 * A slab with big rounded corners in XY and a small rounded rail on the Z edges —
 * the two radii a `RoundedBox` can't separate, since it rounds every edge by the
 * same amount and would be capped by the (very thin) depth.
 */
export function slabGeometry(
  width: number,
  height: number,
  depth: number,
  cornerRadius: number,
  railRadius = Math.min(depth / 2.6, 0.14),
): THREE.ExtrudeGeometry {
  const bevel = Math.min(railRadius, depth / 2 - 0.001)
  const geometry = new THREE.ExtrudeGeometry(roundedRectShape(width, height, cornerRadius), {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 24,
    steps: 1,
  })
  // Extrude runs from -bevel to (depth - bevel), so re-centre it on the origin.
  geometry.translate(0, 0, -(depth - bevel * 2) / 2)
  geometry.computeVertexNormals()
  return geometry
}

/** Flat rounded-rect panel in the XY plane — used for the glass front and camera plate. */
export function panelGeometry(width: number, height: number, cornerRadius: number): THREE.ShapeGeometry {
  return new THREE.ShapeGeometry(roundedRectShape(width, height, cornerRadius), 24)
}
