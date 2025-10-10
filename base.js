
  function toggleAccordion(id) {
    const panels = document.querySelectorAll('.accordion-panel');
    panels.forEach(panel => {
      if (panel.id !== id) {
        panel.classList.remove('show');
      }
    });
    const panel = document.getElementById(id);
    panel.classList.toggle('show');
  }

  function closeAccordion(id) {
    document.getElementById(id).classList.remove('show');
  }
  
  
  function toggleMenu() {
    const menu = document.getElementById('flyoutMenu');
    menu.classList.toggle('open');
  }

function filterTrades() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    const category = tile.getAttribute('data-category');
    tile.style.display = (selectedCategory === 'All Services' || category === selectedCategory) ? 'block' : 'none';
  });
}

function toggleTile(tile, title, description) {
  tile.classList.toggle('selected');
  document.getElementById('modalTitle').innerText = title;
  document.getElementById('modalDescription').innerText = description;
  document.getElementById('tradeModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('tradeModal').style.display = 'none';
}
