// Quick script to get your auth token from Android device
const { exec } = require('child_process');
const path = require('path');

const adbPath = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe');

console.log('🔍 Fetching auth token from your phone...\n');

// Command to get AsyncStorage data from React Native app
const command = `"${adbPath}" shell "run-as com.kirayedar24 cat /data/data/com.kirayedar24/files/RCTAsyncLocalStorage_V1/manifest.json 2>/dev/null || cat /data/user/0/com.kirayedar24/files/RCTAsyncLocalStorage_V1/manifest.json 2>/dev/null"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.log('⚠️  Unable to read from device storage directly.');
    console.log('\n📱 Alternative: Check your auth token via app logs:');
    console.log('   Run this command to see token in logs:');
    console.log(`   "${adbPath}" logcat -d | findstr "authToken"`);
    return;
  }

  try {
    // Try to find authToken in the output
    if (stdout.includes('authToken')) {
      console.log('✅ Found token data!\n');
      console.log(stdout);
    } else {
      console.log('📱 Token not found in manifest. Checking actual storage...\n');
      
      // Try to get the actual token value
      const getTokenCmd = `"${adbPath}" shell "run-as com.kirayedar24 cat /data/data/com.kirayedar24/files/RCTAsyncLocalStorage_V1/authToken 2>/dev/null"`;
      
      exec(getTokenCmd, (err2, stdout2) => {
        if (stdout2) {
          console.log('✅ Your Bearer Token:\n');
          console.log(stdout2.trim());
          console.log('\n📋 Copy this token and use it in Postman as:');
          console.log('   Authorization: Bearer ' + stdout2.trim());
        } else {
          console.log('⚠️  No token found. You may need to login first in the app.');
        }
      });
    }
  } catch (e) {
    console.log('⚠️  Error parsing data:', e.message);
  }
});

console.log('\n💡 Alternative: Login through app and check Metro bundler logs for the token.');
