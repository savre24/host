const CYBERPANEL_URL = "https://panel.savredigital.com";
const CYBERPANEL_USERNAME = process.env.CYBERPANEL_USERNAME;
const CYBERPANEL_PASSWORD = process.env.CYBERPANEL_PASSWORD;

async function test() {
  try {
    const res = await fetch(CYBERPANEL_URL + '/');
    const cookies = res.headers.get("set-cookie");
    console.log("Initial Cookies:", cookies);
  } catch (e) {
    console.error("Fetch Error:", e.message);
  }
}
test();
