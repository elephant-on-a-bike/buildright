// Corner Banner Loader
// Automatically loads corner banner configuration from JSON
(function() {
  const isSubfolder = window.location.pathname.includes('/buildingrennovations/');
  const configPath = isSubfolder ? 'corner-banner.json' : 'corner-banner.json';
  
  fetch(configPath)
    .then(response => response.json())
    .then(config => {
      const banner = document.getElementById('cornerBanner');
      if (banner && config.imageName) {
        const link = document.createElement('a');
        link.href = config.link || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'corner-banner-link';
        link.title = config.hoverText || '';
        
        const img = document.createElement('img');
        const assetPath = isSubfolder ? '../assets/' : 'assets/';
        img.src = assetPath + config.imageName;
        img.alt = config.hoverText || 'Promotion';
        img.className = 'corner-banner-img';
        
        link.appendChild(img);
        banner.appendChild(link);
      }
    })
    .catch(err => console.log('Corner banner config not loaded:', err));
})();
