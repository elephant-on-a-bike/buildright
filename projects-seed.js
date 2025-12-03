(function(){
  function seedIfEmpty(){
    const KEY = 'fitouthub_projects';
    const existing = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(existing) && existing.length > 0) return;
    const now = new Date().toISOString();
    const demo = Array.from({length: 12}).map((_,i)=>{
      const id = 'project_' + String(i+1).padStart(4,'0');
      const names = ['Harbor Office Fitout','Skyline Retail Refresh','Nova Cafe Renovation','Atlas Gym Upgrade','Cedar Clinic Refurb','Aurora Co-Working Build','BluePeak Lobby Revamp','Vertex Apartment Reno','Summit Warehouse Retrofit','Bright Showroom Setup','Riverbank Studio Build','Parkview Penthouse Reno'];
      const clients = ['ABC Holdings','Sunrise Group','Urban Foods','Wellness Corp','CarePlus Ltd','Aurora Labs','BluePeak Partners','Vertex Living','Summit Logistics','Bright Retail','Riverbank Media','Parkview Estates'];
      const contractors = ['Harbor Build Ltd','Skyline Contracting Co.','Nova Renovations Group','Atlas Projects Ltd','Cedar Works Co.','Aurora Interiors Ltd','BluePeak Solutions','Vertex Construct Ltd','Summit Design & Build','Bright Works Ltd','Riverbank Builders','Parkview Construction'];
      const status = (i%5===0)?'approved':(i%7===0)?'rejected':'pending';
      return { id, projectName: names[i%names.length], clientName: clients[i%clients.length], contractorName: contractors[i%contractors.length], registrationDate: now, status, data: { budget: 50000 + i*7500, region: ['Hong Kong Island','Kowloon'][i%2] } };
    });
    localStorage.setItem(KEY, JSON.stringify(demo));
    window.dispatchEvent(new CustomEvent('projects-seeded', { detail: { count: demo.length } }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', seedIfEmpty); else seedIfEmpty();
})();