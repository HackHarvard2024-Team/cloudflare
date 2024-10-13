import { decode } from './polylineDecoder';
import { fetch4Gons } from './polygonFetcher';
import { polylineIntersectsPolygon } from './geometryUtils';
  
  addEventListener("fetch", event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        });
    }

    // Ensure request is of type application/json
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("application/json")) {
        return new Response("Content-Type must be application/json", { 
            status: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        });
    }

    let data;
    try {
        data = await request.json();
    } catch (error) {
        return new Response("Invalid JSON input", { 
            status: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        });
    }

    if (!data.polyline) {
        return new Response("Missing 'polyline' field in request body", { 
            status: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        });
    }

    const decodedPolyline = decode(data.polyline).map(([lat, lon]) => ({ lat, lon }));
    const polygons = await fetch4Gons();
    const overlappingPolygons = polygons.filter(polygon => polylineIntersectsPolygon(decodedPolyline, polygon));

    return new Response(JSON.stringify(overlappingPolygons), {
        headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
    });
}



// Testing Carlisle -> Harrisburg
// const testPolyline = "BG0k21sCnionzEkN0BrEssBnGkpCvC8fjD8kBnB4S_Ek_BvCkcnBgPnBoL7B4SToGnB8QnBkNnBgP7BoV7BwW7BwWnBsO7BgU7B8anBgPnBwRToLAsEnBoQTgKvCgoBnBkNToGnB8VnB8Q7BwWnB0PnB0UnBwMTgKnG0mCvCgejD8pBnB0PnBsO7Bkc7B4XnBkXT8GToLTwHT0KnB8LvCwbnBkSAsET0FTwMnBwMTkITsJnBgP3DgyBzFwyC7Gw3CrEk1BnGgwCnBwMjDopBnB4S7BkcvCwqB7Bkc7B8ajDwlB7BsiBvCopBToQnB0ZTsTnB4c_J4cvCoGvCgFjDgFvCkDnBoBjDwCvC8BzKwH3DA3DA3DAjDTrEnBjDnB3D7B3DvCjDvCjDjD7BvCjDrEvCrEnBvC7B_E7BnGnBnGTnGA3DUvHoBvHoBrEwCnGwC_E4DzFkD3D4DjDkDvCkD7BsE7BsEnB4DTkDAwHA0FUkI8BwbkNgU4I0e8LofgKs2BwRonCwW43Fk6B8pBkNo-Iw8C83EwvBozB8Qg9DgoB89BgUge0K8QwH0PkIsY0P8awWsO4N0K0K8LkNsJwMgUsd4SwgBoQgjB4NwlBkNokBwM0jBsT41B8fg6CwMgjB4XoiC0eg1C4Sk1BkNokB4NokBgP0jB8Q4hBwRofsTgesTwbwWwbwWsYouB0yBouBgyBkX0Z0jBkmB8GkIgewgB4_B4kCoGoGwRsTwgBgjBwgBgjBsEgF4hB8kBwCwC0ZkcozB03BkX0Zo9B0hCwW8agZoao4Bg8BgPoQwvBozBwb8fgK8L8f8pBoQ4XsO0U4XokB4SofwR0ekDoG0ZsxBsTopBwRgoBoL4cwHsT4NwlB4N8pBwM4rBgKkmBgK8pB0F8a8GokBoLgmC0FouB4D4mBkDouB8BsxBoB08BA4sDT04DkDk2IU8xCsEwoC4D03BgF41BoGk1B0F0tBoGgtB0K0mCkIwvB0K41B4N0hCsYolDgZ87CgK4hB8VonC4IoasJ8a4SozBoaslCkcwjC4csgC0e0hCkX8uBof46BwgB46BwRsd8Q4c8a8pBge8uBge4rBkmBk1BwvBk_B4mBk1B0hCk4C4ckmB4X8f8uB89BoG4IwjCg6C4DgFsEoGkX0ewW0eokBkwB0KsO4wBoiC4mBs2Bsd4rB4mBg8BsTge4Sof8awvBwR8fgZouB0PofkXouBwbs7BgZ84B4I4SwWsxB0Zw5Bwbo9BwMwb0Z84B0FwMgK8VgoBw3Cs7BojEo9BgnE4wBstDoV8uBkco9B4N8fwMge0Kwb4I0Z4DkNkDoL8GoaoG4cwCkNkDsTsEsiBwCkcU8GoBgjBoB0yBUozBAg1CoBk7DA0PU4xDoB8zB8BkhBwCkhBgF4wB0F0tB4I4uC4IkuCgU00FoG03BkS4jF8a4zHwCoV0Fw0BwCgUwC8a4I4zCoB0KsEwvBoB0PoB8kBUsJ8B0tBoBouBAwCT8GT0FjD4X7GofnLkhBrOge7QwbrT4XnVgUvWwRjXgP3hB4SzZ0KrdwM7a8L7asJrd0K_YsJrxB8QrE8B3mBwM7f8LvboLzUgKnV8L_Y0P7asTnkBgeriBwgBjcoazZgZzPsOr2B8zB_8D80DniC89B_gC4_B79Bk6BrYwWrY8V_YgUzZkS3DwC7QoLnGsEvb8QrJ0FjhBsT7a0P7iCsnBzPsJzyBsdzP4InG4D7akS7VsOzZ4SvMgKnGgFjX4SnkBgejhBwbnjE0uD7pB0jBjrBokBnpBkhBjcsTvbkSvqBsY_T0KnkBsT7pBgZjN4InasT_Y8V_YkX3XgZ_d0jB3XwgBrT0ejS8fjSwgB3rB01CjSokBjI8Q7GoQT8BvMkc_O4mBvM8kBzKwlB3I4mB_Jk6B_EgoB_Eo9BjDgoBrO00FjI8lDnL8tEjI0kD3IoqDzF8nCrJsyD7BsYvHg6CvCgevC8f_EkpCrE46BvCgoBzF8sCTkIvC8fnB8VjI0iE7B0UTsJjD4rBjDgtBTwH7B4cjD8pBT0FnG01CrE41BnBsOT4SnBoa7BoVzF4pC7BofnBkXAwgBU0ZoBkX8B4XUoGoBwHoB4NwCsT4D4XsE4X0FwgBwCgPwHwqB8kBs7GsE4XgFoawH8pBkIkwBoG8kBoVw6D0F8f0K89BkIouBkI8uB4N0wC0KsgCwHouBoBsJkDoV8BgPkDgeUwH4DkrB8G06C4D8zB0FkkC4DsxBoB4SwH87C4D8uB8B4cwCgeoBwR8G82C8Gg6C4D0jB8Gw0B0F8fwH0jBsJ0jBwRk1BkDkIoQopB8BgFkIkS4XouBwMoVge0yBwRgegK8QkDsEkN8VwbgtB4rBwtCkNwWwMoV4I0PkS0e0oBkkCsOsY0P8asJoQsEwHoL4S0FsJkD0F8G8LwHkN0F0KwH4NsJwR0PsdoL0U4X4rBgKsT4IoQ4c41B8a4wBoQsd4I0PsJ8QgKwR8GwM4D8G4DoG0jB4_B4kCk7DoGoL8L8VwoC4gEkIsO4D8GgUokB8GkNwHkN4X89BkNge4N4coL4XsJ0UoGkNsEgK0FsJ0KwMkI0FoG4DkI8BgKoB0FAkI7BoLnGgKrJoGjI4N_TkXnf0ZvlBkcrd41Br7BkI3I0KnL4IvH0FjDkI7BsJnB4N7B8L3DkIrEgFjDsE3DwCvC4D3D8GjIkI3NgF3I0F_JgF3I4DnG4D7G0F_J4Nna4I7Q8VvqBgP7a8GvMkDzF8GnLgFjI0FzKwHrOkIzPkDnGgK_TsY7uB4IjS8BzF8B_EgK7a8LvRgCpC"; 
// console.log(decode(testPolyline));
