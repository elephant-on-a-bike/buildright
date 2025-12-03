// Migration script to consolidate old contractor/reseller data into unified professionals database
// Run this once to migrate existing data

(function() {
  console.log('Starting professionals database migration...');

  try {
    // Get existing data from old keys
    const oldContractors = JSON.parse(localStorage.getItem('fitouthub_contractors') || '[]');
    const oldResellers = JSON.parse(localStorage.getItem('fitouthub_resellers') || '[]');
    
    // Get current professionals data
    const currentProfessionals = JSON.parse(localStorage.getItem('fitouthub_professionals') || '[]');
    
    let migrated = 0;
    
    // Migrate contractors
    oldContractors.forEach((contractorData, index) => {
      const record = {
        id: 'contractor_migrated_' + Date.now() + '_' + index,
        type: 'contractor',
        businessType: 'sole_trader',
        registrationDate: new Date().toISOString(),
        status: 'pending',
        data: contractorData
      };
      currentProfessionals.push(record);
      migrated++;
    });
    
    // Migrate resellers
    oldResellers.forEach((resellerData, index) => {
      const record = {
        id: 'reseller_migrated_' + Date.now() + '_' + index,
        type: 'reseller',
        businessType: 'company',
        registrationDate: new Date().toISOString(),
        status: 'pending',
        data: resellerData
      };
      currentProfessionals.push(record);
      migrated++;
    });
    
    if (migrated > 0) {
      // Save consolidated data
      localStorage.setItem('fitouthub_professionals', JSON.stringify(currentProfessionals));
      
      // Backup old data before removing (in case we need to rollback)
      localStorage.setItem('fitouthub_contractors_backup', localStorage.getItem('fitouthub_contractors') || '[]');
      localStorage.setItem('fitouthub_resellers_backup', localStorage.getItem('fitouthub_resellers') || '[]');
      
      // Remove old keys
      localStorage.removeItem('fitouthub_contractors');
      localStorage.removeItem('fitouthub_resellers');
      
      console.log(`Migration complete! Migrated ${migrated} records.`);
      console.log('Backups saved to fitouthub_contractors_backup and fitouthub_resellers_backup');
    } else {
      console.log('No data to migrate.');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
})();
