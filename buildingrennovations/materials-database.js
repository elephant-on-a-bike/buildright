(function(){
  const DB_KEY = 'renovation_materials';
  
  function $(sel){ return document.querySelector(sel); }
  function $all(sel){ return Array.from(document.querySelectorAll(sel)); }
  
  function loadDB(){ try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); } catch(e){ return []; } }
  function saveDB(list){ localStorage.setItem(DB_KEY, JSON.stringify(list)); }
  
  function escapeHtml(str){ return String(str||'').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
  
  let currentFilter = '';
  
  function renderStats(){
    const list = loadDB();
    const fitout = list.filter(m=>m.channels?.fitouthub).length;
    const renov = list.filter(m=>m.channels?.renovationhub).length;
    const suppliers = [...new Set(list.map(m=>String(m.supplier||'').trim().toLowerCase()).filter(Boolean))].length;
    $('#statTotal').textContent = list.length;
    $('#statFitout').textContent = fitout;
    $('#statRenovation').textContent = renov;
    $('#statSuppliers').textContent = suppliers;
  }
  
  function matchesFilter(mat, filter){
    if(!filter) return true;
    const q = filter.toLowerCase();
    const n = String(mat.name||'').toLowerCase();
    const c = String(mat.category||'').toLowerCase();
    const s = String(mat.supplier||'').toLowerCase();
    const links = (mat.linked_projects||[]).join(' ').toLowerCase();
    return n.includes(q) || c.includes(q) || s.includes(q) || links.includes(q);
  }
  
  function renderMaterials(){
    const list = loadDB();
    const filtered = list.filter(m=>matchesFilter(m, currentFilter));
    const grid = $('#materialsGrid');
    const empty = $('#emptyState');
    
    if(!filtered.length){
      grid.innerHTML = '';
      empty.style.display = 'block';
      // Translate empty state if i18n is available
      const h = empty.querySelector('h3');
      const p = empty.querySelector('p');
      if (window.t) {
        if (h) h.textContent = window.t('materials.empty.title', 'No materials found');
        if (p) p.textContent = window.t('materials.empty.body', 'Click "+ Add Material" to create your first entry.');
      }
      return;
    }
    empty.style.display = 'none';
    
    grid.innerHTML = filtered.map(mat=>{
      const channels = [];
      if(mat.channels?.fitouthub) channels.push('<span class="channel-badge badge-fitout">'+ (window.t?window.t('materials.channel.fitout','FitOut Hub'):'FitOut Hub') +'</span>');
      if(mat.channels?.renovationhub) channels.push('<span class="channel-badge badge-renovation">'+ (window.t?window.t('materials.channel.renovation','Renovations Hub'):'Renovations Hub') +'</span>');
      
      const certs = (mat.certifications||[]).length;
      const envs = (mat.environmental_declarations||[]).length;
      const links = (mat.linked_projects||[]).length;
      
      return `
        <div class="material-card" data-id="${escapeHtml(mat.id)}">
          <div class="material-header">
            <h3>${escapeHtml(mat.name)}</h3>
            <span class="small" style="color:var(--gray-600)">${escapeHtml(mat.category)}</span>
          </div>
          <div class="material-meta" style="margin-bottom:4px">
            <strong>${window.t?window.t('materials.field.supplier','Supplier:'):'Supplier:'}</strong> ${escapeHtml(mat.supplier||'—')}
          </div>
          <div class="material-channels">${channels.join('')}</div>
          <div class="material-meta">
            <strong>${window.t?window.t('materials.field.unit','Unit:'):'Unit:'}</strong> ${escapeHtml(mat.delivery_unit||'—')} | 
            <strong>${window.t?window.t('materials.field.price','Price:'):'Price:'}</strong> ${mat.price||0} | 
            <strong>${window.t?window.t('materials.field.lead','Lead:'):'Lead:'}</strong> ${mat.lead_time_days||0} ${window.t?window.t('materials.field.days','days'):'days'}
          </div>
          <div class="material-meta">
            <strong>${window.t?window.t('materials.field.certs','Certifications:'):'Certifications:'}</strong> ${certs} | 
            <strong>${window.t?window.t('materials.field.envs','Environmental:'):'Environmental:'}</strong> ${envs} | 
            <strong>${window.t?window.t('materials.field.linked','Linked Projects:'):'Linked Projects:'}</strong> ${links}
          </div>
          <div class="material-actions">
            <button class="btn btn-outline btn-view" data-id="${escapeHtml(mat.id)}">${window.t?window.t('materials.btn.view','View'):'View'}</button>
            <button class="btn btn-outline btn-edit" data-id="${escapeHtml(mat.id)}">${window.t?window.t('materials.btn.edit','Edit'):'Edit'}</button>
            <button class="btn btn-outline btn-download" data-id="${escapeHtml(mat.id)}">${window.t?window.t('materials.btn.download','Download JSON'):'Download JSON'}</button>
            <button class="btn btn-outline btn-delete" data-id="${escapeHtml(mat.id)}" style="color:#b00020">${window.t?window.t('materials.btn.delete','Delete'):'Delete'}</button>
          </div>
        </div>
      `;
    }).join('');
    
    // Bind actions
    $all('.btn-view').forEach(btn=>{
      btn.addEventListener('click', ()=> openView(btn.getAttribute('data-id')));
    });
    $all('.btn-edit').forEach(btn=>{
      btn.addEventListener('click', ()=> openEdit(btn.getAttribute('data-id')));
    });
    $all('.btn-download').forEach(btn=>{
      btn.addEventListener('click', ()=> downloadOne(btn.getAttribute('data-id')));
    });
    $all('.btn-delete').forEach(btn=>{
      btn.addEventListener('click', ()=> deleteMaterial(btn.getAttribute('data-id')));
    });
  }
  
  function refresh(){
    renderStats();
    renderMaterials();
  }
  
  function downloadOne(id){
    const mat = loadDB().find(m=>m.id===id);
    if(!mat) return;
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    download('material-' + mat.id + '-' + stamp + '.json', JSON.stringify(mat, null, 2));
  }
  
  function deleteMaterial(id){
    if(!confirm('Delete this material? This cannot be undone.')) return;
    const list = loadDB().filter(m=>m.id!==id);
    saveDB(list);
    refresh();
  }
  
  function download(filename, text){
    const a = document.createElement('a');
    a.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
    a.setAttribute('download', filename);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  
  // View modal
  const viewOverlay = $('#viewOverlay');
  const viewModal = $('#viewModal');
  const viewClose = $('#viewClose');
  const viewTitle = $('#viewTitle');
  const viewBody = $('#viewBody');
  
  function openViewModal(){
    viewOverlay.classList.add('open');
    viewModal.classList.add('open');
  }
  function closeViewModal(){
    viewOverlay.classList.remove('open');
    viewModal.classList.remove('open');
  }
  
  viewClose?.addEventListener('click', closeViewModal);
  viewOverlay?.addEventListener('click', closeViewModal);
  
  function openView(id){
    const mat = loadDB().find(m=>m.id===id);
    if(!mat) return;
    
    viewTitle.textContent = mat.name;
    
    const channels = [];
    if(mat.channels?.fitouthub) channels.push('<span class="channel-badge badge-fitout">'+ (window.t?window.t('materials.channel.fitout','FitOut Hub'):'FitOut Hub') +'</span>');
    if(mat.channels?.renovationhub) channels.push('<span class="channel-badge badge-renovation">'+ (window.t?window.t('materials.channel.renovation','Renovations Hub'):'Renovations Hub') +'</span>');
    
    // Create clickable links for stored files (base64 or metadata only)
    function makeFileLink(fileObj, index, prefix){
      const fileName = escapeHtml(fileObj.name);
      const fileSize = Math.round(fileObj.size/1024);
      if (fileObj.dataUrl) {
        // Has base64 data - create link that opens in new tab
        return `<li><a href="${fileObj.dataUrl}" target="_blank" class="file-link" style="color:var(--blue-700);font-weight:600">${fileName}</a> <em>(${fileSize} KB)</em></li>`;
      } else {
        // Metadata only - show as inactive link
        return `<li><a href="#" class="file-link-inactive" data-file="${escapeHtml(JSON.stringify(fileObj))}" style="color:var(--gray-600);cursor:not-allowed">${fileName}</a> <em>(${fileSize} KB) - metadata only</em></li>`;
      }
    }
    
    const certs = (mat.certifications||[]).map((f,i)=> makeFileLink(f,i,'cert')).join('') || '<li><em>None</em></li>';
    const envs = (mat.environmental_declarations||[]).map((f,i)=> makeFileLink(f,i,'env')).join('') || '<li><em>None</em></li>';
    const links = (mat.linked_projects||[]).map(p=> `<li>${escapeHtml(p)}</li>`).join('') || '<li><em>None</em></li>';
    
    viewBody.innerHTML = `
      <div class="form-group">
        <strong>${window.t?window.t('materials.field.supplier','Supplier:'):'Supplier:'}</strong> ${escapeHtml(mat.supplier||'—')}
      </div>
      <div class="form-group">
        <strong>${window.t?window.t('materials.field.category','Category:'):'Category:'}</strong> ${escapeHtml(mat.category||'—')}
      </div>
      <div class="form-group">
        <strong>${window.t?window.t('materials.field.channels','Channels:'):'Channels:'}</strong><br>${channels.join(' ')}
      </div>
      <div class="section-grid" style="margin:12px 0">
        <div><strong>${window.t?window.t('materials.field.unitFull','Delivery Unit:'):'Delivery Unit:'}</strong> ${escapeHtml(mat.delivery_unit||'—')}</div>
        <div><strong>${window.t?window.t('materials.field.price','Price:'):'Price:'}</strong> ${mat.price||0}</div>
        <div><strong>${window.t?window.t('materials.field.leadFull','Lead Time:'):'Lead Time:'}</strong> ${mat.lead_time_days||0} ${window.t?window.t('materials.field.days','days'):'days'}</div>
      </div>
      <div class="form-group">
        <strong>${window.t?window.t('materials.field.certsFull','Certification Files'):'Certification Files'} (${(mat.certifications||[]).length}):</strong>
        <ul style="margin:4px 0 0 20px">${certs || '<li><em>None</em></li>'}</ul>
      </div>
      <div class="form-group">
        <strong>${window.t?window.t('materials.field.envsFull','Environmental Declarations'):'Environmental Declarations'} (${(mat.environmental_declarations||[]).length}):</strong>
        <ul style="margin:4px 0 0 20px">${envs || '<li><em>None</em></li>'}</ul>
      </div>
      <div class="form-group">
        <strong>${window.t?window.t('materials.field.linked','Linked Projects:'):'Linked Projects:'}</strong>
        <ul style="margin:4px 0 0 20px">${links}</ul>
      </div>
      <div class="form-group">
        <strong>${window.t?window.t('materials.field.created','Created:'):'Created:'}</strong> ${new Date(mat.createdAt||'').toLocaleString()}
      </div>
    `;
    
    // Bind file link clicks for metadata-only files
    viewBody.querySelectorAll('.file-link-inactive').forEach(link=>{
      link.addEventListener('click', (e)=>{
        e.preventDefault();
        alert('This material was created before file storage was implemented. Only metadata is available.\n\nTo view files: re-upload this material via the Edit button.');
      });
    });
    
    openViewModal();
  }
  
  // Edit modal
  const editOverlay = $('#editOverlay');
  const editModal = $('#editModal');
  const editClose = $('#editClose');
  const editCancel = $('#editCancel');
  const editForm = $('#editForm');
  const editErrors = $('#editErrors');
  
  function openEditModal(){
    editOverlay.classList.add('open');
    editModal.classList.add('open');
  }
  function closeEditModal(){
    editOverlay.classList.remove('open');
    editModal.classList.remove('open');
  }
  
  editClose?.addEventListener('click', closeEditModal);
  editCancel?.addEventListener('click', closeEditModal);
  editOverlay?.addEventListener('click', closeEditModal);
  document.addEventListener('keydown', e=>{ 
    if(e.key==='Escape') {
      if(editModal.classList.contains('open')) closeEditModal();
      if(viewModal.classList.contains('open')) closeViewModal();
    }
  });
  
  function openEdit(id){
    let mat = null;
    if(id){
      mat = loadDB().find(m=>m.id===id);
      if(!mat) return;
    } else {
      mat = {};
    }
    const isNew = !id;
    $('#editId').value = mat.id || '';
    $('#editSupplier').value = mat.supplier || '';
    $('#editName').value = mat.name || '';
    $('#editCategory').value = mat.category || 'Partitions';
    $('#editUnit').value = mat.delivery_unit || '';
    $('#editPrice').value = mat.price || '';
    $('#editLead').value = mat.lead_time_days || '';
    $('#editFitout').checked = (mat.channels?.fitouthub ?? true);
    $('#editRenov').checked = (mat.channels?.renovationhub ?? true);
    $('#editLinks').value = (mat.linked_projects||[]).join(', ');
    $('#editTitle').textContent = isNew ? 'Add Material' : 'Edit Material';
    editErrors.textContent = '';
    listFilesInModal('editCertList', mat.certifications||[]);
    listFilesInModal('editEnvList', mat.environmental_declarations||[]);
    
    // Show/hide and bind view buttons based on file availability
    const btnViewCerts = $('#btnViewCerts');
    const btnViewEnvs = $('#btnViewEnvs');
    const hasCerts = (mat.certifications||[]).length > 0;
    const hasEnvs = (mat.environmental_declarations||[]).length > 0;
    
    if(btnViewCerts){
      btnViewCerts.style.display = hasCerts ? '' : 'none';
      if(hasCerts){
        btnViewCerts.replaceWith(btnViewCerts.cloneNode(true)); // Remove old listeners
        $('#btnViewCerts').addEventListener('click', ()=> viewStoredFiles('editCertList', 'certification'));
      }
    }
    if(btnViewEnvs){
      btnViewEnvs.style.display = hasEnvs ? '' : 'none';
      if(hasEnvs){
        btnViewEnvs.replaceWith(btnViewEnvs.cloneNode(true)); // Remove old listeners
        $('#btnViewEnvs').addEventListener('click', ()=> viewStoredFiles('editEnvList', 'environmental'));
      }
    }
    
    openEditModal();
  }
  
  function listFilesInModal(rootId, files){
    const el = $('#'+rootId);
    if(!el) return;
    if(!files || !files.length){ 
      el.innerHTML = '<em>' + (window.t?window.t('materials.form.noFiles','No files'):'No files') + '</em>'; 
      el.dataset.files = JSON.stringify([]);
      return; 
    }
    el.innerHTML = files.map(f=> {
      const status = f.dataUrl ? '✓' : '(metadata only)';
      return '- ' + escapeHtml(f.name) + ' (' + Math.round((f.size||0)/1024) + ' KB) ' + status;
    }).join('<br>');
    el.dataset.files = JSON.stringify(files);
  }
  
  function viewStoredFiles(listId, fileType){
    const el = $('#'+listId);
    if(!el) return;
    const files = JSON.parse(el.dataset.files || '[]');
    if(!files.length){ alert((window.t?window.t('materials.err.noFiles','No'):'No') + ' ' + fileType + (window.t?window.t('materials.err.filesAvailable',' files available.'):' files available.')); return; }
    const withData = files.filter(f=>f.dataUrl);
    if(!withData.length){ alert((window.t?window.t('materials.err.noViewable','No viewable'):'No viewable') + ' ' + fileType + (window.t?window.t('materials.err.reupload',' files. Files must be re-uploaded to enable viewing.'):' files. Files must be re-uploaded to enable viewing.')); return; }
    withData.forEach(f=>{ window.open(f.dataUrl, '_blank'); });
  }
  
  editForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const id = $('#editId').value;
    const supplier = $('#editSupplier').value.trim();
    const name = $('#editName').value.trim();
    const category = $('#editCategory').value;
    if(!supplier){ editErrors.textContent = window.t?window.t('materials.err.supplierReq','Supplier name is required.'):'Supplier name is required.'; return; }
    if(!name){ editErrors.textContent = window.t?window.t('materials.err.nameReq','Material name is required.'):'Material name is required.'; return; }
    
    const list = loadDB();
    const isNew = !id;
    
    // Check duplicate on different ID
    const dup = list.find(m => m.id !== id && String(m.name||'').trim().toLowerCase() === name.toLowerCase() && String(m.category||'').trim().toLowerCase() === category.toLowerCase() && String(m.supplier||'').trim().toLowerCase() === supplier.toLowerCase());
    if(dup){ editErrors.textContent = window.t?window.t('materials.err.duplicate','A material with this name, category, and supplier already exists.'):'A material with this name, category, and supplier already exists.'; return; }
    
    const certFiles = $('#editCertFiles')?.files || [];
    const envFiles = $('#editEnvFiles')?.files || [];
    const links = $('#editLinks').value.split(',').map(s=>s.trim()).filter(Boolean);
    
    async function filesToBase64(fileList) {
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB per file
      const files = Array.from(fileList || []);
      const results = [];
      for (const file of files) {
        if (file.size > MAX_SIZE) {
          alert(`File "${file.name}" is too large (${Math.round(file.size/1024/1024)}MB). Maximum 2MB per file.`);
          continue;
        }
        const dataUrl = await readFileAsDataURL(file);
        results.push({ name: file.name, size: file.size, type: file.type, dataUrl });
      }
      return results;
    }
    
    function readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    
    editErrors.textContent = window.t?window.t('materials.status.processing','Processing files...'):'Processing files...';
    editErrors.style.color = 'inherit';
    
    if(isNew){
      if(!certFiles.length){ editErrors.textContent = window.t?window.t('materials.err.certsReq','At least one certification file is required.'):'At least one certification file is required.'; editErrors.style.color = '#b00020'; return; }
      const newMat = {
        id: uid(),
        supplier,
        name,
        category,
        delivery_unit: $('#editUnit').value.trim(),
        price: Number($('#editPrice').value || 0),
        lead_time_days: Number($('#editLead').value || 0),
        channels: { fitouthub: !!$('#editFitout').checked, renovationhub: !!$('#editRenov').checked },
        certifications: await filesToBase64(certFiles),
        environmental_declarations: await filesToBase64(envFiles),
        linked_projects: links,
        createdAt: new Date().toISOString()
      };
      list.push(newMat);
    } else {
      const idx = list.findIndex(m=>m.id===id);
      if(idx===-1){ editErrors.textContent = window.t?window.t('materials.err.notFound','Material not found.'):'Material not found.'; editErrors.style.color = '#b00020'; return; }
      list[idx].supplier = supplier;
      list[idx].name = name;
      list[idx].category = category;
      list[idx].delivery_unit = $('#editUnit').value.trim();
      list[idx].price = Number($('#editPrice').value || 0);
      list[idx].lead_time_days = Number($('#editLead').value || 0);
      list[idx].channels = { fitouthub: !!$('#editFitout').checked, renovationhub: !!$('#editRenov').checked };
      if(certFiles.length) list[idx].certifications = [...(list[idx].certifications||[]), ...(await filesToBase64(certFiles))];
      if(envFiles.length) list[idx].environmental_declarations = [...(list[idx].environmental_declarations||[]), ...(await filesToBase64(envFiles))];
      list[idx].linked_projects = links;
    }
    saveDB(list);
    closeEditModal();
    refresh();
  });
  
  // Search
  $('#searchInput')?.addEventListener('input', (e)=>{
    currentFilter = e.target.value.trim();
    renderMaterials();
  });
  $('#btnClearSearch')?.addEventListener('click', ()=>{
    $('#searchInput').value = '';
    currentFilter = '';
    renderMaterials();
  });
  
  // Export all
  $('#btnExport')?.addEventListener('click', ()=>{
    const list = loadDB();
    if(!list.length){ alert('No materials to export.'); return; }
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    download('materials-export-' + stamp + '.json', JSON.stringify(list, null, 2));
  });
  
  // Wire up drag-and-drop for modal file inputs
  function setupDragDrop(dropId, inputId, listId){
    const drop = $('#'+dropId);
    const input = $('#'+inputId);
    const list = $('#'+listId);
    if(!drop || !input) return;
    drop.addEventListener('click', ()=> input.click());
    drop.addEventListener('dragover', e=>{ e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', ()=> drop.classList.remove('dragover'));
    drop.addEventListener('drop', e=>{
      e.preventDefault(); drop.classList.remove('dragover');
      input.files = e.dataTransfer.files;
      if(list) list.innerHTML = Array.from(input.files).map(f=> '- '+escapeHtml(f.name)+' ('+Math.round(f.size/1024)+' KB)').join('<br>');
    });
    input.addEventListener('change', ()=>{
      if(list) list.innerHTML = Array.from(input.files).map(f=> '- '+escapeHtml(f.name)+' ('+Math.round(f.size/1024)+' KB)').join('<br>');
    });
  }
  // Initialize after DOM is ready to ensure elements exist
  document.addEventListener('DOMContentLoaded', () => {
    // Bind add button
    const addBtn = $('#btnAdd');
    if (addBtn) addBtn.addEventListener('click', () => openEdit(null));

    setupDragDrop('editCertDrop', 'editCertFiles', 'editCertList');
    setupDragDrop('editEnvDrop', 'editEnvFiles', 'editEnvList');

    refresh();
  });
  // Re-render when i18n dictionary becomes ready or changes
  document.addEventListener('i18n:ready', refresh);
  document.addEventListener('i18n:changed', refresh);
  // (refresh is now called inside DOMContentLoaded above)
})();
