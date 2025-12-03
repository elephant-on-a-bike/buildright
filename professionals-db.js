// Professional Database Manager
// Manages contractor and reseller registrations in a unified localStorage database

(function() {
  const DB_KEY = 'fitouthub_professionals';
  const SEED_KEY = 'fitouthub_professionals_seed_loaded';

  // Initialize from seed + localStorage
  async function init() {
    const seed = await loadSeed();
    const local = loadLocal();
    
    // If seed not yet loaded into localStorage, merge once
    const seedLoaded = localStorage.getItem(SEED_KEY);
    if (!seedLoaded && seed.length > 0) {
      const merged = mergeByIdPreferLocal(seed, local);
      saveLocal(merged);
      localStorage.setItem(SEED_KEY, 'true');
      return merged;
    }
    
    // Otherwise return local storage (which may include seed from previous load)
    return local.length > 0 ? local : seed;
  }

  // Load seed file
  async function loadSeed() {
    try {
      const res = await fetch('fitout_professionals.json', { cache: 'no-cache' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('Could not load professionals seed:', e);
      return [];
    }
  }

  // Load from localStorage
  function loadLocal() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error loading local professionals:', e);
      return [];
    }
  }

  // Merge arrays by ID (local entries override seed)
  function mergeByIdPreferLocal(seed, local) {
    const byId = new Map();
    seed.forEach(p => { if (p && p.id) byId.set(p.id, p); });
    local.forEach(p => { if (p && p.id) byId.set(p.id, p); }); // Override
    return Array.from(byId.values());
  }

  // Save to localStorage
  function saveLocal(professionals) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(professionals));
      return true;
    } catch (e) {
      console.error('Error saving professionals database:', e);
      return false;
    }
  }

  // Get all professionals
  function getAll() {
    return loadLocal();
  }

  // Get professionals by type
  function getByType(type) {
    return getAll().filter(p => p.type === type);
  }

  // Get professionals by status
  function getByStatus(status) {
    return getAll().filter(p => p.status === status);
  }

  // Get professional by ID
  function getById(id) {
    return getAll().find(p => p.id === id);
  }

  // Add a new professional
  function add(professional) {
    const professionals = getAll();
    professionals.push(professional);
    save(professionals);
    return professional;
  }

  // Update a professional
  function update(id, updates) {
    const professionals = getAll();
    const index = professionals.findIndex(p => p.id === id);
    if (index !== -1) {
      professionals[index] = { ...professionals[index], ...updates };
      save(professionals);
      return professionals[index];
    }
    return null;
  }

  // Update professional status
  function updateStatus(id, status) {
    return update(id, { 
      status, 
      statusUpdatedDate: new Date().toISOString() 
    });
  }

  // Delete a professional
  function remove(id) {
    const professionals = getAll();
    const filtered = professionals.filter(p => p.id !== id);
    save(filtered);
    return filtered.length < professionals.length;
  }

  // Save to localStorage (now uses saveLocal internally)
  function save(professionals) {
    return saveLocal(professionals);
  }

  // Clear all data
  function clear() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(SEED_KEY);
  }

  // Export stats
  function getStats() {
    const all = getAll();
    return {
      total: all.length,
      contractors: all.filter(p => p.type === 'contractor').length,
      resellers: all.filter(p => p.type === 'reseller').length,
      pending: all.filter(p => p.status === 'pending').length,
      approved: all.filter(p => p.status === 'approved').length,
      rejected: all.filter(p => p.status === 'rejected').length,
      soleTraders: all.filter(p => p.businessType === 'sole_trader').length,
      companies: all.filter(p => p.businessType === 'company').length
    };
  }

  // Export database as JSON for download
  function exportToJSON() {
    const data = getAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fitouthub-professionals-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import database from JSON
  function importFromJSON(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (Array.isArray(data)) {
        save(data);
        return { success: true, count: data.length };
      }
      return { success: false, error: 'Invalid data format' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Expose API globally
  window.ProfessionalsDB = {
    init,
    getAll,
    getByType,
    getByStatus,
    getById,
    add,
    update,
    updateStatus,
    remove,
    clear,
    getStats,
    exportToJSON,
    importFromJSON
  };

  console.log('ProfessionalsDB initialized. Use window.ProfessionalsDB to interact.');
})();
