const axios = require("axios");

async function test() {
  try {
    const res = await axios.post(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        origin: { address: 'Delhi' },
        destination: { address: 'Lucknow' },
        travelMode: 'DRIVE',
      },
      {
        headers: {
          'X-Goog-Api-Key': 'AIzaSyCaF6BH9bcG87mz6EmdRG8RPGGHF5lpJ1I',
          'X-Goog-FieldMask': 'routes.legs,routes.polyline,routes.duration,routes.distanceMeters',
        },
      }
    );
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.log("FAILED:", err.response ? err.response.data : err.message);
  }
}
test();
