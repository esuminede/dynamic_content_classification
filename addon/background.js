// IndexedDB Setup
let db;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SiteClassifierDB', 1);

    request.onerror = (event) => {
      reject('Database error: ' + event.target.errorCode);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sites')) {
        db.createObjectStore('sites', { keyPath: 'name' });
      }
    };
  });
}

async function addSite(name, category) {
  await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sites'], 'readwrite');
    const store = transaction.objectStore('sites');
    const request = store.add({ name, category });

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject('Add failed: ' + event.target.errorCode);
  });
}

async function checkSiteExists(name) {
  await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sites'], 'readonly');
    const store = transaction.objectStore('sites');
    const request = store.get(name);

    request.onsuccess = () => resolve(request.result !== undefined);
    request.onerror = (event) => reject('Check failed: ' + event.target.errorCode);
  });
}

// Static Category Map
const categoryMap = {
  "facebook.com": "Sosyal Medya",
  "twitter.com": "Sosyal Medya",
  "bbc.com": "Haber",
  "nytimes.com": "Haber",
  "youtube.com": "Video",
  "netflix.com": "Eğlence"
};

// API Configuration
const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const API_KEY = "92918fcdc6894eeeaa9e8c42a78e9f3e.IRYY8mww0GDPoQVB";

// API Classification Function
async function classifySiteWithAPI(hostname) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "glm-4",
        messages: [{
          role: "user",
          content: `Bu siteyi kategorize et: ${hostname}. Kategoriler: Sosyal Medya, Haber, Video, Eğlence, Diğer, Eğitim, Alışveriş. Yanıt sadece kategori adını içersin.`
        }],
        max_tokens: 20
      })
    });

    const data = await response.json();
    const category = data.choices[0]?.message?.content?.trim();
    
    if (!category) throw new Error("API response empty");
    
    return category;
  } catch (error) {
    console.error("API Error:", error);
    return "Diğer"; // Default category on error
  }
}

// Main Navigation Listener
chrome.webNavigation.onCompleted.addListener(async(details) => {
  const url = new URL(details.url);
  const hostname = url.hostname;

    const exists = await checkSiteExists(hostname);
    
    if (!exists) {
      // Get static category if available
      const staticCategory = categoryMap[hostname];
      
      // Call API for dynamic classification
      const apiCategory = await classifySiteWithAPI(hostname);
      
      // Save the final category (prefer API result)
      await addSite(hostname, apiCategory || staticCategory);
      console.log(`✅ ${hostname} -> ${apiCategory || staticCategory}`);
    }
});
