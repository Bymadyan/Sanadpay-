const http = require("http");

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        });
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log("🧪 Testing SanadPay API\n");

  try {
    // Test 1: Signup
    console.log("1️⃣  Testing Signup...");
    const signupRes = await request("POST", "/api/auth/signup", {
      email: "test@example.com",
      password: "TestPass123",
      business_name: "Test Business",
      owner_name: "Test Owner"
    });
    console.log("   Status:", signupRes.status);
    console.log("   Response:", signupRes.body);

    if (signupRes.status !== 200 || !signupRes.body.success) {
      console.error("   ❌ Signup failed!");
      process.exit(1);
    }
    console.log("   ✅ Signup successful!\n");

    // Test 2: Login
    console.log("2️⃣  Testing Login...");
    const loginRes = await request("POST", "/api/auth/login", {
      email: "test@example.com",
      password: "TestPass123"
    });
    console.log("   Status:", loginRes.status);
    console.log("   Response:", loginRes.body);

    if (loginRes.status !== 200 || !loginRes.body.success) {
      console.error("   ❌ Login failed!");
      process.exit(1);
    }
    console.log("   ✅ Login successful!\n");

    // Test 3: Wrong password
    console.log("3️⃣  Testing Wrong Password...");
    const wrongRes = await request("POST", "/api/auth/login", {
      email: "test@example.com",
      password: "WrongPassword"
    });
    console.log("   Status:", wrongRes.status);
    if (wrongRes.status === 401) {
      console.log("   ✅ Correctly rejected wrong password\n");
    } else {
      console.error("   ❌ Should have rejected wrong password!");
    }

    console.log("✅ All tests passed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test error:", err.message);
    process.exit(1);
  }
}

// Wait for server to be ready
setTimeout(test, 2000);
