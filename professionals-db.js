// Professional Database Manager
// Manages contractor and reseller registrations in a unified localStorage database

(function() {
  const DB_KEY = 'fitouthub_professionals';

  // Get all professionals
  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    } catch (e) {
      console.error('Error reading professionals database:', e);
      return [];
    }
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

  // Save to localStorage
  function save(professionals) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(professionals));
      return true;
    } catch (e) {
      console.error('Error saving professionals database:', e);
      return false;
    }
  }

  // Clear all data
  function clear() {
    localStorage.removeItem(DB_KEY);
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
