// UsersDB - Persistent user account management with localStorage fallback
(function(){
  const LS_KEY = 'fitouthub_users';
  const SEED_KEY = 'fitouthub_users_seed_loaded';
  
  // User database wrapper
  const UsersDB = {
    // Initialize from seed + localStorage
    async init(){
      const seed = await this.loadSeed();
      const local = this.loadLocal();
      
      // If seed not yet loaded into localStorage, merge once
      const seedLoaded = localStorage.getItem(SEED_KEY);
      if(!seedLoaded && seed.length > 0){
        const merged = this.mergeUsers(seed, local);
        this.saveLocal(merged);
        localStorage.setItem(SEED_KEY, 'true');
        return merged;
      }
      
      // Otherwise return local storage (which may include seed from previous load)
      return local.length > 0 ? local : seed;
    },
    
    // Load seed file
    async loadSeed(){
      const isSubfolder = window.location.pathname.includes('/buildingrennovations/');
      const path = isSubfolder ? '../users.json' : 'users.json';
      try {
        const res = await fetch(path, { cache: 'no-cache' });
        if(!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch(e){
        console.warn('Could not load users seed:', e);
        return [];
      }
    },
    
    // Load from localStorage
    loadLocal(){
      try {
        const raw = localStorage.getItem(LS_KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch(e){
        console.error('Error loading local users:', e);
        return [];
      }
    },
    
    // Save to localStorage
    saveLocal(users){
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(users));
      } catch(e){
        console.error('Error saving users:', e);
      }
    },
    
    // Merge users by ID (later entries override earlier)
    mergeUsers(seed, local){
      const byId = new Map();
      [...seed, ...local].forEach(u => {
        if(u && u.id) byId.set(u.id, u);
      });
      return Array.from(byId.values());
    },
    
    // Get all users
    getAll(){
      return this.loadLocal();
    },
    
    // Get user by ID
    getById(id){
      const users = this.loadLocal();
      return users.find(u => u.id === id) || null;
    },
    
    // Get user by nickname (case-insensitive)
    getByNickname(nickname){
      const users = this.loadLocal();
      const lower = nickname.toLowerCase();
      return users.find(u => u.nickname.toLowerCase() === lower) || null;
    },
    
    // Add new user
    add(user){
      if(!user || !user.id || !user.nickname){
        console.error('Invalid user object');
        return { success: false, error: 'Invalid user object' };
      }
      const users = this.loadLocal();
      // Check for duplicate nickname
      if(users.some(u => u.nickname.toLowerCase() === user.nickname.toLowerCase())){
        return { success: false, error: 'Nickname already exists' };
      }
      users.push(user);
      this.saveLocal(users);
      return { success: true, user };
    },
    
    // Update existing user
    update(id, updates){
      const users = this.loadLocal();
      const index = users.findIndex(u => u.id === id);
      if(index === -1){
        return { success: false, error: 'User not found' };
      }
      users[index] = { ...users[index], ...updates, id }; // Preserve ID
      this.saveLocal(users);
      return { success: true, user: users[index] };
    },
    
    // Remove user
    remove(id){
      const users = this.loadLocal();
      const filtered = users.filter(u => u.id !== id);
      if(filtered.length === users.length){
        return { success: false, error: 'User not found' };
      }
      this.saveLocal(filtered);
      return { success: true };
    },
    
    // Export all users as JSON file
    exportToJSON(filename){
      const users = this.loadLocal();
      const json = JSON.stringify(users, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `users_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    
    // Import users from JSON (merge with existing)
    importFromJSON(jsonString){
      try {
        const imported = JSON.parse(jsonString);
        if(!Array.isArray(imported)){
          return { success: false, error: 'Invalid format: expected array' };
        }
        const current = this.loadLocal();
        const merged = this.mergeUsers(current, imported);
        this.saveLocal(merged);
        return { success: true, count: merged.length };
      } catch(e){
        return { success: false, error: e.message };
      }
    },
    
    // Clear all users (dangerous - use with caution)
    clear(){
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(SEED_KEY);
    }
  };
  
  // Expose globally
  window.UsersDB = UsersDB;
})();
