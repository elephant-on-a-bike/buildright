(function(){
  function canonicalizeRegion(name){
    if (!name) return name;
    const s = String(name).toLowerCase().trim();
    if (s.includes('hong kong') && s.includes('island')) return 'Hong Kong Island';
    if (s === 'hk island' || s === 'hong kong island') return 'Hong Kong Island';
    if (s === 'kowloon') return 'Kowloon';
    if (s.includes('new') && s.includes('territ')) return 'New Territories';
    if (s === 'nt') return 'New Territories';
    if (s.includes('lantau')) return 'Lantau Island';
    if (s.includes('outlying')) return 'Outlying Islands';
    return name; // leave unchanged if not recognized
  }

  function enrich(data){
    const regions = [
      'Hong Kong Island', 'Kowloon', 'New Territories', 'Lantau Island', 'Outlying Islands'
    ];
    const companyPrefixes = ['Harbor', 'Skyline', 'Bright', 'Vertex', 'Nova', 'Atlas', 'Summit', 'Cedar', 'Aurora', 'BluePeak'];
    const companyNouns = ['Build', 'Construct', 'Renovations', 'Contracting', 'Projects', 'Works', 'Solutions', 'Design', 'Interiors', 'Services'];
    const companySuffixes = ['Ltd', 'Limited', 'Co.', 'Group'];
    const peopleFirst = ['Alex', 'Taylor', 'Jordan', 'Sam', 'Casey', 'Morgan', 'Jamie', 'Avery', 'Riley', 'Cameron'];
    const peopleLast = ['Wong', 'Chan', 'Lee', 'Ng', 'Lam', 'Cheung', 'Lau', 'Ho', 'Leung', 'Cheng'];
    function genCompanyName(index, type){
      const p = companyPrefixes[index % companyPrefixes.length];
      const n = companyNouns[(index + 3) % companyNouns.length];
      const s = companySuffixes[(index + 5) % companySuffixes.length];
      const mid = type === 'reseller' ? 'Supply' : n;
      return `${p}${type === 'reseller' ? ' Trade' : ''} ${mid} ${s}`;
    }
    function genPersonCompany(index){
      const f = peopleFirst[index % peopleFirst.length];
      const l = peopleLast[(index + 2) % peopleLast.length];
      const n = companyNouns[(index + 1) % companyNouns.length];
      return `${f} ${l} ${n}`;
    }
    return data.map((rec, idx) => {
      // Ensure 2 regions per entry
      let current = (rec.data && Array.isArray(rec.data.service_area)) ? rec.data.service_area.slice(0, 2) : [];
      // Normalize any existing names to canonical booking-form labels
      current = current.map(canonicalizeRegion).filter(Boolean);
      if (current.length === 0) {
        const a = regions[idx % regions.length];
        const b = regions[(idx + 1) % regions.length];
        rec.data = rec.data || {};
        rec.data.service_area = [a, b];
      } else if (current.length === 1) {
        const a = current[0];
        const b = regions.find(r => r !== a) || regions[0];
        rec.data.service_area = [a, b];
      } else {
        rec.data.service_area = current;
      }

      // Mix statuses for realism
      if (!rec.status || rec.status === 'pending') {
        if (idx % 5 === 0) rec.status = 'approved';
        else if (idx % 8 === 0) rec.status = 'rejected';
        else rec.status = 'pending';
      }

      // Assign rating if missing or out of range (3.5 - 5.0, step 0.1)
      if (typeof rec.rating !== 'number' || rec.rating < 0 || rec.rating > 5) {
        const base = 3.5 + (Math.random() * 1.5); // 3.5..5.0
        rec.rating = Math.round(base * 10) / 10;
      }

      // Humanize names for better testing experience
      rec.data = rec.data || {};
      if (rec.type === 'contractor') {
        if (rec.businessType === 'company') {
          // Prefer business_name for companies; fallback to full_name
          const name = genCompanyName(idx, 'contractor');
          rec.data.business_name = rec.data.business_name || name;
          if (!rec.data.full_name) rec.data.full_name = rec.data.business_name;
        } else {
          // Sole traders: use person-like name + trade
          const name = genPersonCompany(idx);
          rec.data.full_name = rec.data.full_name && !/^Contractor \d+$/i.test(rec.data.full_name) ? rec.data.full_name : name;
        }
      } else if (rec.type === 'reseller') {
        const name = genCompanyName(idx, 'reseller');
        rec.data.business_name = rec.data.business_name && !/^Reseller \d+$/i.test(rec.data.business_name) ? rec.data.business_name : name;
      }

      return rec;
    });
  }

  function ensureTwoRegionsAndRating(records){
    const regions = [
      'Hong Kong Island', 'Kowloon', 'New Territories', 'Lantau Island', 'Outlying Islands'
    ];
    let changed = false;
    const out = records.map((rec, idx) => {
      const d = rec.data || {};
      let sa = Array.isArray(d.service_area) ? d.service_area.slice(0, 2) : [];
      sa = sa.map(canonicalizeRegion).filter(Boolean);
      if (sa.length < 2) {
        const a = sa[0] || regions[idx % regions.length];
        const b = regions.find(r => r !== a) || regions[0];
        d.service_area = [a, b];
        rec.data = d;
        changed = true;
      }
      if (typeof rec.rating !== 'number' || rec.rating < 0 || rec.rating > 5) {
        const base = 3.5 + (Math.random() * 1.5);
        rec.rating = Math.round(base * 10) / 10;
        changed = true;
      }
      return rec;
    });
    return { changed, out };
  }

  function seedIfEmpty(){
    try {
      const KEY = 'fitouthub_professionals';
      const existing = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(existing) && existing.length > 0) {
        // Non-destructive enrichment: ensure 2 regions + rating present
        const { changed, out } = ensureTwoRegionsAndRating(existing);
        if (changed) {
          localStorage.setItem(KEY, JSON.stringify(out));
          window.dispatchEvent(new CustomEvent('professionals-seeded', { detail: { count: out.length, enriched: true } }));
        }
        return; // already seeded
      }
      fetch('fitout_professionals.json', { cache: 'no-cache' })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (Array.isArray(data) && data.length) {
            const enriched = enrich(data);
            localStorage.setItem(KEY, JSON.stringify(enriched));
            const count = enriched.length;
            console.log('[Professionals Seed] Seeded', count, 'records');
            // Notify listeners (e.g., admin page) to refresh
            window.dispatchEvent(new CustomEvent('professionals-seeded', { detail: { count } }));
          } else {
            console.warn('[Professionals Seed] No data found in fitout_professionals.json');
          }
        })
        .catch(err => console.error('[Professionals Seed] Error:', err));
    } catch (e) {
      console.error('[Professionals Seed] Failed:', e);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', seedIfEmpty);
  } else {
    seedIfEmpty();
  }
})();