(function(){
  function $(sel, ctx){ return (ctx||document).querySelector(sel); }
  function el(tag, attrs, ...children){
    const e = document.createElement(tag);
    if(attrs){ Object.entries(attrs).forEach(([k,v])=>{
      if(k==='class') e.className = v; else if(k==='html') e.innerHTML = v; else if(k==='text') e.textContent = v; else e.setAttribute(k,v);
    }); }
    children.forEach(c=>{ if(c==null) return; if(typeof c==='string') e.appendChild(document.createTextNode(c)); else e.appendChild(c); });
    return e;
  }
  function uid(){ return Math.random().toString(36).slice(2,10); }

  function repeater(containerId, buildRow){
    const root = document.getElementById(containerId);
    function add(initial){
      const row = buildRow(initial||{});
      root.appendChild(row);
      return row;
    }
    function values(mapper){
      return Array.from(root.children).map(mapper);
    }
    function removeRow(row){ row.remove(); }
    return { root, add, values, removeRow };
  }

  function build(){
    // Certifications repeater (name, document_url)
    const certRep = repeater('rep_certs', (init) => {
      const row = el('div', {class:'repeater-row'});
      const name = el('input', {class:'form-control', placeholder:'Name', value:init.name||''});
      const url = el('input', {class:'form-control', placeholder:'Document URL', value:init.document_url||''});
      const actions = el('div',{class:'row-actions'},
        el('button',{type:'button', class:'btn btn-outline'},'Remove')
      );
      actions.firstChild.addEventListener('click', ()=>row.remove());
      row.append(
        el('div',{class:'section-grid'},
          el('div',{class:'form-group'}, el('label',{class:'form-label'},'Name'), name),
          el('div',{class:'form-group'}, el('label',{class:'form-label'},'Document URL'), url)
        ),
        actions
      );
      return row;
    });

    // Job types repeater (simple string)
    const jobRep = repeater('rep_job_types', (init)=>{
      const row = el('div',{class:'repeater-row'});
      const txt = el('input',{class:'form-control', placeholder:'Job type (e.g., Façade Upgrade)', value:init||''});
      const actions = el('div',{class:'row-actions'}, el('button',{type:'button', class:'btn btn-outline'},'Remove'));
      actions.firstChild.addEventListener('click', ()=>row.remove());
      row.append(el('div',{class:'form-group'}, el('label',{class:'form-label'},'Job Type'), txt), actions);
      return row;
    });

    // Service areas repeater (simple string)
    const areaRep = repeater('rep_service_areas', (init)=>{
      const row = el('div',{class:'repeater-row'});
      const txt = el('input',{class:'form-control', placeholder:'Service area (e.g., Kowloon)', value:init||''});
      const actions = el('div',{class:'row-actions'}, el('button',{type:'button', class:'btn btn-outline'},'Remove'));
      actions.firstChild.addEventListener('click', ()=>row.remove());
      row.append(el('div',{class:'form-group'}, el('label',{class:'form-label'},'Service Area'), txt), actions);
      return row;
    });

    // Products -> categories -> items
    const prodRep = repeater('rep_products', (init)=>{
      const catRow = el('div',{class:'repeater-row'});
      const cat = el('input',{class:'form-control', placeholder:'Category (e.g., Construction Materials)', value:init.category||''});
      const itemsRoot = el('div',{class:'repeater-items'});
      const addItemBtn = el('button',{type:'button', class:'btn btn-outline'},'Add Item');
      const removeCatBtn = el('button',{type:'button', class:'btn btn-outline'},'Remove Category');

      function addItem(itemInit){
        const r = el('div',{class:'repeater-row'});
        const name = el('input',{class:'form-control', placeholder:'Name', value:itemInit?.name||''});
        const brand = el('input',{class:'form-control', placeholder:'Brand', value:itemInit?.brand||''});
        const sku = el('input',{class:'form-control', placeholder:'SKU', value:itemInit?.sku||''});
        const price = el('input',{class:'form-control', type:'number', placeholder:'Price', value:itemInit?.price||''});
        const unit = el('input',{class:'form-control', placeholder:'Unit', value:itemInit?.unit||''});
        const rem = el('button',{type:'button', class:'btn btn-outline'},'Remove');
        rem.addEventListener('click',()=>r.remove());
        r.append(
          el('div',{class:'section-grid'},
            el('div',{class:'form-group'}, el('label',{class:'form-label'},'Name'), name),
            el('div',{class:'form-group'}, el('label',{class:'form-label'},'Brand'), brand),
            el('div',{class:'form-group'}, el('label',{class:'form-label'},'SKU'), sku),
            el('div',{class:'form-group'}, el('label',{class:'form-label'},'Price'), price),
            el('div',{class:'form-group'}, el('label',{class:'form-label'},'Unit'), unit)
          ),
          el('div',{class:'row-actions'}, rem)
        );
        itemsRoot.appendChild(r);
      }

      addItemBtn.addEventListener('click',()=>addItem({}));
      removeCatBtn.addEventListener('click',()=>catRow.remove());

      (init.items||[]).forEach(addItem);

      catRow.append(
        el('div',{class:'form-group'}, el('label',{class:'form-label'},'Category'), cat),
        itemsRoot,
        el('div',{class:'row-actions'}, addItemBtn, removeCatBtn)
      );
      return catRow;
    });

    // Portfolio repeater (project_name + images[])
    const portRep = repeater('rep_portfolio', (init)=>{
      const row = el('div',{class:'repeater-row'});
      const name = el('input',{class:'form-control', placeholder:'Project name', value:init.project_name||''});
      const imagesRoot = el('div',{class:'repeater-items'});
      const addImg = el('button',{type:'button', class:'btn btn-outline'},'Add Image');
      const remove = el('button',{type:'button', class:'btn btn-outline'},'Remove Entry');
      function addImage(val){
        const r = el('div',{class:'repeater-row'});
        const url = el('input',{class:'form-control', placeholder:'Image URL', value:val||''});
        const rem = el('button',{type:'button', class:'btn btn-outline'},'Remove');
        rem.addEventListener('click',()=>r.remove());
        r.append(el('div',{class:'form-group'}, el('label',{class:'form-label'},'Image URL'), url), el('div',{class:'row-actions'}, rem));
        imagesRoot.appendChild(r);
      }
      addImg.addEventListener('click',()=>addImage(''));
      remove.addEventListener('click',()=>row.remove());
      (init.images||[]).forEach(addImage);
      row.append(
        el('div',{class:'form-group'}, el('label',{class:'form-label'},'Project Name'), name),
        imagesRoot,
        el('div',{class:'row-actions'}, addImg, remove)
      );
      return row;
    });

    // References repeater (name + contact)
    const refRep = repeater('rep_refs', (init)=>{
      const row = el('div',{class:'repeater-row'});
      const name = el('input',{class:'form-control', placeholder:'Name', value:init.name||''});
      const contact = el('input',{class:'form-control', placeholder:'Contact (email or phone)', value:init.contact||''});
      const remove = el('button',{type:'button', class:'btn btn-outline'},'Remove');
      remove.addEventListener('click',()=>row.remove());
      row.append(
        el('div',{class:'section-grid'},
          el('div',{class:'form-group'}, el('label',{class:'form-label'},'Name'), name),
          el('div',{class:'form-group'}, el('label',{class:'form-label'},'Contact'), contact)
        ),
        el('div',{class:'row-actions'}, remove)
      );
      return row;
    });

    // Project checklists (strings)
    const fireRep = repeater('rep_fire', (init)=>{
      const row = el('div',{class:'repeater-row'});
      const txt = el('input',{class:'form-control', placeholder:'Fire safety item', value:init||''});
      const rm = el('button',{type:'button', class:'btn btn-outline'},'Remove');
      rm.addEventListener('click',()=>row.remove());
      row.append(el('div',{class:'form-group'}, el('label',{class:'form-label'},'Item'), txt), el('div',{class:'row-actions'}, rm));
      return row;
    });
    const matRep = repeater('rep_mat', (init)=>{
      const row = el('div',{class:'repeater-row'});
      const txt = el('input',{class:'form-control', placeholder:'Material approval item', value:init||''});
      const rm = el('button',{type:'button', class:'btn btn-outline'},'Remove');
      rm.addEventListener('click',()=>row.remove());
      row.append(el('div',{class:'form-group'}, el('label',{class:'form-label'},'Item'), txt), el('div',{class:'row-actions'}, rm));
      return row;
    });

    // Bind add buttons
    $('#add_cert').addEventListener('click',()=>certRep.add({name:'',document_url:''}));
    $('#add_job_type').addEventListener('click',()=>jobRep.add(''));
    $('#add_service_area').addEventListener('click',()=>areaRep.add(''));
    $('#add_product_cat').addEventListener('click',()=>prodRep.add({category:'', items:[]}));
    $('#add_portfolio').addEventListener('click',()=>portRep.add({project_name:'', images:[]}));
    $('#add_fire').addEventListener('click',()=>fireRep.add(''));
    $('#add_mat').addEventListener('click',()=>matRep.add(''));

    // Seed minimal helpful defaults
    jobRep.add('Full Building Renovation');
    areaRep.add('Hong Kong Island');

    function buildPayload(){
      const account = {
        id: 'acc-' + uid(),
        type: $('#ren_type').value,
        basic_info: {
          name: $('#ren_name').value.trim(),
          contact: {
            phone: $('#ren_phone').value.trim(),
            email: $('#ren_email').value.trim(),
            address: $('#ren_address').value.trim()
          }
        },
        credentials: {
          license: $('#ren_license').value.trim(),
          insurance: $('#ren_insurance').value.trim(),
          certifications: certRep.values(row=>{
            const inputs = row.querySelectorAll('input');
            return { name: inputs[0].value.trim(), document_url: inputs[1].value.trim() };
          })
        },
        services: {
          job_types: jobRep.values(row=> row.querySelector('input').value.trim()).filter(Boolean),
          service_area: areaRep.values(row=> row.querySelector('input').value.trim()).filter(Boolean)
        },
        products: prodRep.values(row=>{
          const category = row.querySelector('input').value.trim();
          const items = Array.from(row.querySelectorAll('.repeater-items > .repeater-row')).map(ir=>{
            const ins = ir.querySelectorAll('input');
            return {
              name: ins[0].value.trim(),
              brand: ins[1].value.trim(),
              sku: ins[2].value.trim(),
              price: Number(ins[3].value || 0),
              unit: ins[4].value.trim()
            };
          }).filter(i=>i.name);
          return { category, items };
        }).filter(p=>p.category || (p.items&&p.items.length)),
        portfolio: portRep.values(row=>{
          const name = row.querySelector('input').value.trim();
          const images = Array.from(row.querySelectorAll('.repeater-items input')).map(i=>i.value.trim()).filter(Boolean);
          return { project_name: name, images };
        }).filter(p=>p.project_name),
        references: refRep.values(row=>{
          const ins = row.querySelectorAll('input');
          return { name: ins[0].value.trim(), contact: ins[1].value.trim() };
        }).filter(r=>r.name),
        compliance: {
          background_check_consent: $('#ren_bgcheck').checked,
          terms_agreed: $('#ren_terms').checked
        },
        initial_score: 0
      };

      const project = {
        id: 'prj-' + uid(),
        building_info: {
          name: $('#prj_name').value.trim(),
          floor_size: Number($('#prj_floor_size').value || 0),
          number_of_floors: Number($('#prj_floors').value || 0),
          building_type: $('#prj_btype').value.trim()
        },
        scope: $('#prj_scope').value.trim(),
        total_area: Number($('#prj_total_area').value || 0),
        cost_estimate: { min: Number($('#prj_min').value || 0), max: Number($('#prj_max').value || 0) },
        checklists: {
          fire_safety: fireRep.values(row=> row.querySelector('input').value.trim()).filter(Boolean),
          material_approval: matRep.values(row=> row.querySelector('input').value.trim()).filter(Boolean)
        },
        bonding_agreement: $('#prj_bond').value.trim()
      };

      return { accounts: [account], projects: [project] };
    }

    function validate(){
      const errs = [];
      if(!$('#ren_name').value.trim()) errs.push('Account name is required');
      const email = $('#ren_email').value.trim();
      if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Email is invalid');
      if(!$('#ren_terms').checked) errs.push('You must agree to the terms');
      if(!$('#prj_name').value.trim()) errs.push('Project building name is required');
      return errs;
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

    $('#btnPreview').addEventListener('click', ()=>{
      const errs = validate();
      const errEl = $('#renErrors');
      if(errs.length){ errEl.textContent = errs.join(' • '); return; } else { errEl.textContent = ''; }
      const payload = buildPayload();
      const pre = $('#jsonPreview');
      pre.style.display = 'block';
      pre.textContent = JSON.stringify(payload, null, 2);
      $('#btnDownload').disabled = false;
      $('#saveStatus').textContent = 'Preview ready';
    });

    $('#btnDownload').addEventListener('click', ()=>{
      const payload = buildPayload();
      const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
      download('renovation-' + stamp + '.json', JSON.stringify(payload, null, 2));
      $('#saveStatus').textContent = 'JSON downloaded';
    });

    // References add button was declared but not bound earlier
    $('#add_ref').addEventListener('click',()=>refRep.add({name:'', contact:''}));
  }

  document.addEventListener('DOMContentLoaded', build);
})();
