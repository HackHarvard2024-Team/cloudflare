// Intersection logic remains the same as before
function lineIntersectsPolygon(line, polygon) {
    for (let i = 0; i < polygon.length; i++) {
        const start = polygon[i];
        const end = polygon[(i + 1) % polygon.length];
        if (lineIntersectsLine(line[0], line[1], start, end)) {
            return true;
        }
    }
    return false;
} 
  
function lineIntersectsLine(a1, a2, b1, b2) {
const det = (a2.lat - a1.lat) * (b2.lon - b1.lon) - (a2.lon - a1.lon) * (b2.lat - b1.lat);
if (det === 0) return false; // Lines are parallel
const lambda = ((b2.lon - b1.lon) * (b2.lat - a1.lat) - (b2.lat - b1.lat) * (b2.lon - a1.lon)) / det;
const gamma = ((a2.lon - a1.lon) * (b2.lat - a1.lat) - (a2.lat - a1.lat) * (b2.lon - a1.lon)) / det;
return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}
  
function pointInsidePolygon(point, polygon) {
const [px, py] = point;
let isInside = false;
for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { lat: ix, lon: iy } = polygon[i];
    const { lat: jx, lon: jy } = polygon[j];
    const intersect = ((iy > py) !== (jy > py)) && (px < (jx - ix) * (py - iy) / (jy - iy) + ix);
    if (intersect) isInside = !isInside;
}
return isInside;
}
  
// Function to check if any polyline segment intersects or any point is inside
function polylineIntersectsPolygon(decodedPolyline, polygon) {
for (let i = 0; i < decodedPolyline.length - 1; i++) {
    const line = [decodedPolyline[i], decodedPolyline[i + 1]];
    if (lineIntersectsPolygon(line, polygon)) {
        return true;
    }
}
// Check if any polyline point is inside the polygon
return decodedPolyline.some(point => pointInsidePolygon([point.lat, point.lon], polygon));
}

export { lineIntersectsPolygon, lineIntersectsLine, pointInsidePolygon, polylineIntersectsPolygon}