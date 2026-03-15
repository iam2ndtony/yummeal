const { Client } = require('pg');

const urls = [
  "postgresql://postgres.qyzycpmmhmdedwssmkdx:123e321eMKD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  "postgresql://postgres.qyzycpmmhmdedwssmkdx:123e321eMKD@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
];

async function test() {
  for (const url of urls) {
    console.log(`Testing: ${url}`);
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      console.log("SUCCESS!");
      await client.end();
      break;
    } catch (err) {
      console.error("FAILED:", err.message);
    }
  }
}

test();
