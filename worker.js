/*
** Decoding Flexible Polyline
*/
const DEFAULT_PRECISION = 5;
const ENCODING_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const DECODING_TABLE = [
    62, -1, -1, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1,
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, -1, -1, -1, -1, 63, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
];
const FORMAT_VERSION = 1;

function decode(encoded) {
    const decoder = decodeUnsignedValues(encoded);
    const header = decodeHeader(decoder[0], decoder[1]);

    const factorDegree = 10 ** header.precision;
    const factorZ = 10 ** header.thirdDimPrecision;
    const { thirdDim } = header;

    let lastLat = 0;
    let lastLng = 0;
    let lastZ = 0;
    const res = [];

    let i = 2;
    for (;i < decoder.length;) {
        const deltaLat = toSigned(decoder[i]);
        const deltaLng = toSigned(decoder[i + 1]);
        lastLat += deltaLat;
        lastLng += deltaLng;

        if (thirdDim) {
            const deltaZ = toSigned(decoder[i + 2]);
            lastZ += deltaZ;
            res.push([lastLat / factorDegree, lastLng / factorDegree, lastZ / factorZ]);
            i += 3;
        } else {
            res.push([lastLat / factorDegree, lastLng / factorDegree]);
            i += 2;
        }
    }

    if (i !== decoder.length) {
        throw new Error('Invalid encoding. Premature ending reached');
    }

    return res;
}

function decodeChar(char) {
    const charCode = char.charCodeAt(0);
    return DECODING_TABLE[charCode - 45];
}

function decodeUnsignedValues(encoded) {
    let result = 0;
    let shift = 0;
    const resList = [];

    encoded.split('').forEach((char) => {
        const value = decodeChar(char);
        result |= (value & 0x1F) << shift;
        if ((value & 0x20) === 0) {
            resList.push(result);
            result = 0;
            shift = 0;
        } else {
            shift += 5;
        }
    });

    if (shift > 0) {
        throw new Error('Invalid encoding');
    }

    return resList;
}

function decodeHeader(version, encodedHeader) {
    if (version !== FORMAT_VERSION) {
        throw new Error('Invalid format version');
    }
    const precision = encodedHeader & 15;
    const thirdDim = (encodedHeader >> 4) & 7;
    const thirdDimPrecision = (encodedHeader >> 7) & 15;
    return { precision, thirdDim, thirdDimPrecision };
}

function toSigned(val) {
    let res = val;
    if (res & 1) {
        res = ~res;
    }
    res >>= 1;
    return res;
}



/*
** Fetch polygons from Databricks
*/
async function fetch4Gons() {
  // CURRENT MOCK
  return [
      [{ lat: 10, lon: 10 }, { lat: 10, lon: 20 }, { lat: 20, lon: 20 }, { lat: 20, lon: 10 }],
      // More polygons here
  ];
}

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
  if (det === 0) return false;
  const lambda = ((b2.lon - b1.lon) * (b2.lat - a1.lat) - (b2.lat - b1.lat) * (b2.lon - a1.lon)) / det;
  const gamma = ((a2.lon - a1.lon) * (b2.lat - a1.lat) - (a2.lat - a1.lat) * (b2.lon - a1.lon)) / det;
  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

async function handleRequest(request) {
    // Check for the Content-Type header
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("application/json")) {
        return new Response("Content-Type must be application/json", { status: 400 });
    }

    // Try parsing the request body
    let data;
    try {
        data = await request.json();
    } catch (error) {
        return new Response("Invalid JSON input", { status: 400 });
    }

    // Send an immediate acknowledgment response
    return new Response(JSON.stringify({ message: "Request received", data }), {
        headers: { "Content-Type": "application/json" }
    });

    // Remaining code can go here, once you confirm receipt
}

addEventListener("fetch", event => {
    event.respondWith(handleRequest(event.request));
});


/*
** Point-in-polygon check (Ray-Casting Algorithm) **
*/
function pointInsidePolygon(point, polygon) {
    const [px, py] = point;
    let isInside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const { lat: ix, lon: iy } = polygon[i];
        const { lat: jx, lon: jy } = polygon[j];

        const intersect = ((iy > py) !== (jy > py)) &&
                          (px < (jx - ix) * (py - iy) / (jy - iy) + ix);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}



// Testing Carlisle -> Harrisburg
// const testPolyline = "BG0k21sCnionzEkN0BrEssBnGkpCvC8fjD8kBnB4S_Ek_BvCkcnBgPnBoL7B4SToGnB8QnBkNnBgP7BoV7BwW7BwWnBsO7BgU7B8anBgPnBwRToLAsEnBoQTgKvCgoBnBkNToGnB8VnB8Q7BwWnB0PnB0UnBwMTgKnG0mCvCgejD8pBnB0PnBsO7Bkc7B4XnBkXT8GToLTwHT0KnB8LvCwbnBkSAsET0FTwMnBwMTkITsJnBgP3DgyBzFwyC7Gw3CrEk1BnGgwCnBwMjDopBnB4S7BkcvCwqB7Bkc7B8ajDwlB7BsiBvCopBToQnB0ZTsTnB4c_J4cvCoGvCgFjDgFvCkDnBoBjDwCvC8BzKwH3DA3DA3DAjDTrEnBjDnB3D7B3DvCjDvCjDjD7BvCjDrEvCrEnBvC7B_E7BnGnBnGTnGA3DUvHoBvHoBrEwCnGwC_E4DzFkD3D4DjDkDvCkD7BsE7BsEnB4DTkDAwHA0FUkI8BwbkNgU4I0e8LofgKs2BwRonCwW43Fk6B8pBkNo-Iw8C83EwvBozB8Qg9DgoB89BgUge0K8QwH0PkIsY0P8awWsO4N0K0K8LkNsJwMgUsd4SwgBoQgjB4NwlBkNokBwM0jBsT41B8fg6CwMgjB4XoiC0eg1C4Sk1BkNokB4NokBgP0jB8Q4hBwRofsTgesTwbwWwbwWsYouB0yBouBgyBkX0Z0jBkmB8GkIgewgB4_B4kCoGoGwRsTwgBgjBwgBgjBsEgF4hB8kBwCwC0ZkcozB03BkX0Zo9B0hCwW8agZoao4Bg8BgPoQwvBozBwb8fgK8L8f8pBoQ4XsO0U4XokB4SofwR0ekDoG0ZsxBsTopBwRgoBoL4cwHsT4NwlB4N8pBwM4rBgKkmBgK8pB0F8a8GokBoLgmC0FouB4D4mBkDouB8BsxBoB08BA4sDT04DkDk2IU8xCsEwoC4D03BgF41BoGk1B0F0tBoGgtB0K0mCkIwvB0K41B4N0hCsYolDgZ87CgK4hB8VonC4IoasJ8a4SozBoaslCkcwjC4csgC0e0hCkX8uBof46BwgB46BwRsd8Q4c8a8pBge8uBge4rBkmBk1BwvBk_B4mBk1B0hCk4C4ckmB4X8f8uB89BoG4IwjCg6C4DgFsEoGkX0ewW0eokBkwB0KsO4wBoiC4mBs2Bsd4rB4mBg8BsTge4Sof8awvBwR8fgZouB0PofkXouBwbs7BgZ84B4I4SwWsxB0Zw5Bwbo9BwMwb0Z84B0FwMgK8VgoBw3Cs7BojEo9BgnE4wBstDoV8uBkco9B4N8fwMge0Kwb4I0Z4DkNkDoL8GoaoG4cwCkNkDsTsEsiBwCkcU8GoBgjBoB0yBUozBAg1CoBk7DA0PU4xDoB8zB8BkhBwCkhBgF4wB0F0tB4I4uC4IkuCgU00FoG03BkS4jF8a4zHwCoV0Fw0BwCgUwC8a4I4zCoB0KsEwvBoB0PoB8kBUsJ8B0tBoBouBAwCT8GT0FjD4X7GofnLkhBrOge7QwbrT4XnVgUvWwRjXgP3hB4SzZ0KrdwM7a8L7asJrd0K_YsJrxB8QrE8B3mBwM7f8LvboLzUgKnV8L_Y0P7asTnkBgeriBwgBjcoazZgZzPsOr2B8zB_8D80DniC89B_gC4_B79Bk6BrYwWrY8V_YgUzZkS3DwC7QoLnGsEvb8QrJ0FjhBsT7a0P7iCsnBzPsJzyBsdzP4InG4D7akS7VsOzZ4SvMgKnGgFjX4SnkBgejhBwbnjE0uD7pB0jBjrBokBnpBkhBjcsTvbkSvqBsY_T0KnkBsT7pBgZjN4InasT_Y8V_YkX3XgZ_d0jB3XwgBrT0ejS8fjSwgB3rB01CjSokBjI8Q7GoQT8BvMkc_O4mBvM8kBzKwlB3I4mB_Jk6B_EgoB_Eo9BjDgoBrO00FjI8lDnL8tEjI0kD3IoqDzF8nCrJsyD7BsYvHg6CvCgevC8f_EkpCrE46BvCgoBzF8sCTkIvC8fnB8VjI0iE7B0UTsJjD4rBjDgtBTwH7B4cjD8pBT0FnG01CrE41BnBsOT4SnBoa7BoVzF4pC7BofnBkXAwgBU0ZoBkX8B4XUoGoBwHoB4NwCsT4D4XsE4X0FwgBwCgPwHwqB8kBs7GsE4XgFoawH8pBkIkwBoG8kBoVw6D0F8f0K89BkIouBkI8uB4N0wC0KsgCwHouBoBsJkDoV8BgPkDgeUwH4DkrB8G06C4D8zB0FkkC4DsxBoB4SwH87C4D8uB8B4cwCgeoBwR8G82C8Gg6C4D0jB8Gw0B0F8fwH0jBsJ0jBwRk1BkDkIoQopB8BgFkIkS4XouBwMoVge0yBwRgegK8QkDsEkN8VwbgtB4rBwtCkNwWwMoV4I0PkS0e0oBkkCsOsY0P8asJoQsEwHoL4S0FsJkD0F8G8LwHkN0F0KwH4NsJwR0PsdoL0U4X4rBgKsT4IoQ4c41B8a4wBoQsd4I0PsJ8QgKwR8GwM4D8G4DoG0jB4_B4kCk7DoGoL8L8VwoC4gEkIsO4D8GgUokB8GkNwHkN4X89BkNge4N4coL4XsJ0UoGkNsEgK0FsJ0KwMkI0FoG4DkI8BgKoB0FAkI7BoLnGgKrJoGjI4N_TkXnf0ZvlBkcrd41Br7BkI3I0KnL4IvH0FjDkI7BsJnB4N7B8L3DkIrEgFjDsE3DwCvC4D3D8GjIkI3NgF3I0F_JgF3I4DnG4D7G0F_J4Nna4I7Q8VvqBgP7a8GvMkDzF8GnLgFjI0FzKwHrOkIzPkDnGgK_TsY7uB4IjS8BzF8B_EgK7a8LvRgCpC"; 
// console.log(decode(testPolyline));
