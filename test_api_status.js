// Quick API status test
const BASE_URL = 'https://n5.bhoomitechzone.us';

const testEndpoints = [
  '/auth/signup',
  '/auth/login', 
  '/property/properties',
  '/property/add',
  '/property/user'
];

async function testAPI() {
  console.log('🔍 Testing API endpoints...\n');
  
  for (const endpoint of testEndpoints) {
    const url = `${BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const contentType = response.headers.get('content-type');
      console.log(`${endpoint}:`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Content-Type: ${contentType}`);
      
      if (response.status === 404) {
        console.log(`  ❌ Endpoint not found`);
      } else if (response.status === 500) {
        console.log(`  ❌ Server error`);
      } else if (response.ok) {
        console.log(`  ✅ Working`);
      }
      
    } catch (error) {
      console.log(`${endpoint}:`);
      console.log(`  ❌ Network error: ${error.message}`);
    }
    console.log('');
  }
}

testAPI();