const ProjectsDB = (function(){
  const KEY = 'fitouthub_projects';
  function _load(){
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }
  function _save(list){ localStorage.setItem(KEY, JSON.stringify(list)); }
  return {
    getAll(){ return _load(); },
    getById(id){ return _load().find(p => p.id === id); },
    add(project){ const list = _load(); list.push(project); _save(list); return project; },
    update(id, patch){ const list = _load(); const i = list.findIndex(p => p.id === id); if(i>=0){ list[i] = { ...list[i], ...patch }; _save(list); return list[i]; } return null; },
    updateStatus(id, status){ return this.update(id, { status }); },
    remove(id){ const list = _load().filter(p => p.id !== id); _save(list); },
    clear(){ localStorage.removeItem(KEY); },
    exportToJSON(){ const blob = new Blob([JSON.stringify(_load(), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'projects.json'; a.click(); URL.revokeObjectURL(a.href); },
    importFromJSON(text){ try { const data = JSON.parse(text); if(!Array.isArray(data)) return { success:false, error:'Invalid format' }; _save(data); return { success:true, count:data.length }; } catch(e){ return { success:false, error:e.message }; } },
    getStats(){ const arr = _load(); const byStatus = arr.reduce((acc,p)=>{ acc[p.status||'pending']=(acc[p.status||'pending']||0)+1; return acc; },{}); return { total: arr.length, pending: byStatus.pending||0, approved: byStatus.approved||0, rejected: byStatus.rejected||0 }; }
  };
})();