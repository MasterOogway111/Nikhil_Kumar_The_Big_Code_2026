const axios = require("axios");

async function test() {
  try {
    const res = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: '28.6139,77.2090',
          radius: 200,
          key: 'AIzaSyCaF6BH9bcG87mz6EmdRG8RPGGHF5lpJ1I',
        }
      }
    );
    if (res.data.status === 'OK' || res.data.status === 'ZERO_RESULTS') {
      console.log("PLACES_SUCCESS:", res.data.status);
    } else {
      console.log("PLACES_API_ERROR:", res.data.error_message || res.data.status);
    }
  } catch (err) {
    console.log("FAILED:", err.message);
  }
}
test();
