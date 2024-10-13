/*
** Fetch polygons from Databricks
*/
async function fetch4Gons() {
    // CURRENT MOCK
    return [
        [{ lat: 10, lon: 10 }, { lat: 10, lon: 20 }, { lat: 20, lon: 20 }, { lat: 20, lon: 10 }],
        [
          { "lat": 40.22511, "lon": -76.91905 },
          { "lat": 40.22511, "lon": -76.89905 },
          { "lat": 40.24511, "lon": -76.89905 },
          { "lat": 40.24511, "lon": -76.91905 }
      ],    
        // More polygons here
    ];
}

export { fetch4Gons }