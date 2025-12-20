// Test file to verify API integration
// This file can be run to test the auth APIs

// import { authService } from './src/services/authApi.js'; // REMOVED - APIs disabled

const testAuth = async () => {
  console.log('🚀 Testing Authentication APIs...');
  console.log('=' * 50);

  // Test 1: Register a new user
  try {
    console.log('\n📝 Testing Register API...');
    const registerData = {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
      role: 'customer'
    };

    const registerResult = await authService.register(registerData);
    console.log('✅ Register successful:', registerResult.success);
    console.log('📧 Email:', registerData.email);
    
    if (registerResult.success) {
      // Test 2: Login with the registered user
      try {
        console.log('\n🔑 Testing Login API...');
        const loginResult = await authService.login(registerData.email, registerData.password);
        console.log('✅ Login successful:', loginResult.success);
        console.log('🎫 Token received:', !!loginResult.token);
        
        // Test 3: Check stored data
        const userData = await authService.getCurrentUser();
        console.log('👤 User data retrieved:', !!userData);
        console.log('📱 Name:', userData?.name);
        
        // Test 4: Logout
        await authService.logout();
        console.log('🚪 Logout successful');
        
      } catch (loginError) {
        console.error('❌ Login failed:', loginError.message);
      }
    }
    
  } catch (registerError) {
    console.error('❌ Register failed:', registerError.message);
  }
  
  console.log('\n✨ API integration test completed!');
};

export default testAuth;

// Usage:
// import testAuth from './testAuth.js';
// testAuth();