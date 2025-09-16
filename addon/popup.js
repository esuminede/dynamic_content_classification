document.addEventListener("DOMContentLoaded", ()=> {
    chrome.storage.local.get(["visitedSites"], (result) => {
        const sites = result.visitedSites || [];
        const list = document.getElementById("siteList");

        const categories = {};
        sites.forEach(site => {
            if (!categories[site.category]) {
                categories[site.category] = [];
            }
            categories[site.category].push(site.name);
        });
        Object.keys(categories).forEach(category => {
            const categoryTitle = document.createElement("h4");
            categoryTitle.textContent = `${category}`;
            list.appendChild(categoryTitle);

            categories[category].forEach(site =>{
                const li = document.createElement("li");
                li.textContent = site;
                list.appendChild(li);
            });
        });
    });
});