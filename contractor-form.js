(function(){
  const contractorForm = document.getElementById('contractorForm');
  const contractorErrors = document.getElementById('contractorErrors');
  const contractorSubmit = document.getElementById('contractorSubmit');
  const contractorCancel = document.getElementById('contractorCancel');
  
  let soleTraderDefinition = null;
  let companyDefinition = null;
  let currentEntityType = 'Sole Trader'; // Track current form type
  let formData = {};
  let uploadedFiles = {};

  // Load both form definitions
  async function loadFormDefinitions() {
    try {
      const [soleTraderRes, companyRes] = await Promise.all([
        fetch('contractor-form.json'),
        fetch('company-form.json')
      ]);
      
      if (!soleTraderRes.ok || !companyRes.ok) throw new Error('Failed to load form definitions');
      
      soleTraderDefinition = await soleTraderRes.json();
      companyDefinition = await companyRes.json();
      
      buildForm();
    } catch (error) {
      console.error('Error loading contractor forms:', error);
      setError('Unable to load registration form. Please try again later.');
    }
  }
  
  function getCurrentFormDefinition() {
    return currentEntityType === 'Sole Trader' ? soleTraderDefinition : companyDefinition;
  }

  // Build the form dynamically
  function buildForm() {
    if (!contractorForm || !getCurrentFormDefinition()) return;
    
    // Clear existing content
    const existingFields = contractorForm.querySelectorAll('.form-section');
    existingFields.forEach(el => el.remove());

    // Get the submit button container to insert before it
    const ctaActions = contractorForm.querySelector('.cta-actions');
    
    // Add entity type toggle at the top
    const entityTypeSection = createEntityTypeToggle();
    contractorForm.insertBefore(entityTypeSection, ctaActions);

    const formDefinition = getCurrentFormDefinition();
    formDefinition.sections.forEach(section => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'form-section';
      sectionDiv.innerHTML = `<h3 class="section-title">${section.title}</h3>`;

      section.fields.forEach(field => {
        const fieldGroup = createField(field);
        if (fieldGroup) {
          sectionDiv.appendChild(fieldGroup);
        }
      });

      contractorForm.insertBefore(sectionDiv, ctaActions);
    });

    // Add change listeners for validation
    contractorForm.addEventListener('input', validateForm);
    contractorForm.addEventListener('change', validateForm);
  }
  
  // Create entity type toggle
  function createEntityTypeToggle() {
    const section = document.createElement('div');
    section.className = 'form-section entity-type-section';
    section.innerHTML = '<h3 class="section-title">Business Type</h3>';
    
    const toggleGroup = document.createElement('div');
    toggleGroup.className = 'toggle-group';
    
    ['Sole Trader', 'Company'].forEach(option => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toggle-btn';
      btn.textContent = option;
      
      if (option === currentEntityType) {
        btn.classList.add('active');
      }
      
      btn.addEventListener('click', () => {
        if (currentEntityType !== option) {
          currentEntityType = option;
          formData = {}; // Reset form data when switching
          uploadedFiles = {}; // Reset uploaded files
          buildForm(); // Rebuild form with new definition
        }
      });
      
      toggleGroup.appendChild(btn);
    });
    
    section.appendChild(toggleGroup);
    return section;
  }

  // Create individual field based on type
  function createField(field) {
    const group = document.createElement('div');
    group.className = 'form-group';
    group.setAttribute('data-field-id', field.id);

    // Handle conditional fields
    if (field.conditionalOn) {
      group.style.display = 'none';
      group.setAttribute('data-conditional', JSON.stringify(field.conditionalOn));
    }

    const label = document.createElement('label');
    label.className = 'form-label';
    label.htmlFor = field.id;
    label.textContent = field.label + (field.required ? ' *' : '');

    let input;

    switch (field.type) {
      case 'toggle':
        input = createToggle(field);
        break;
      case 'text':
      case 'email':
      case 'tel':
        input = createTextInput(field);
        break;
      case 'number':
        input = createNumberInput(field);
        break;
      case 'textarea':
        input = createTextarea(field);
        break;
      case 'select':
        input = createSelect(field);
        break;
      case 'radio':
        input = createRadio(field);
        break;
      case 'checkbox':
        input = createCheckboxGroup(field);
        break;
      case 'checkbox_single':
        input = createSingleCheckbox(field);
        break;
      case 'file':
        input = createFileInput(field);
        break;
      default:
        console.warn('Unknown field type:', field.type);
        return null;
    }

    if (field.type === 'checkbox_single') {
      // Single checkbox already includes its label
      group.appendChild(input);
    } else if (field.type === 'toggle' || field.type === 'radio' || field.type === 'checkbox') {
      // For toggle/radio/checkbox groups, they handle their own labels
      group.appendChild(label);
      group.appendChild(input);
    } else {
      group.appendChild(label);
      group.appendChild(input);
    }

    if (field.help) {
      const help = document.createElement('small');
      help.className = 'hint';
      help.textContent = field.help;
      group.appendChild(help);
    }

    return group;
  }

  function createToggle(field) {
    const container = document.createElement('div');
    container.className = 'toggle-group';
    
    field.options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toggle-btn';
      btn.textContent = option;
      btn.setAttribute('data-value', option);
      
      if (field.default && option === field.default) {
        btn.classList.add('active');
        formData[field.id] = option;
      }
      
      btn.addEventListener('click', () => {
        container.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        formData[field.id] = option;
        validateForm();
      });
      
      container.appendChild(btn);
    });
    
    return container;
  }

  function createTextInput(field) {
    const input = document.createElement('input');
    input.type = field.type;
    input.id = field.id;
    input.name = field.id;
    input.className = 'form-control';
    if (field.required) input.required = true;
    if (field.maxlength) input.maxLength = field.maxlength;
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.pattern) input.pattern = field.pattern;
    return input;
  }

  function createNumberInput(field) {
    const input = document.createElement('input');
    input.type = 'number';
    input.id = field.id;
    input.name = field.id;
    input.className = 'form-control';
    if (field.required) input.required = true;
    if (field.min !== undefined) input.min = field.min;
    if (field.max !== undefined) input.max = field.max;
    if (field.placeholder) input.placeholder = field.placeholder;
    return input;
  }

  function createTextarea(field) {
    const textarea = document.createElement('textarea');
    textarea.id = field.id;
    textarea.name = field.id;
    textarea.className = 'form-control';
    if (field.required) textarea.required = true;
    if (field.rows) textarea.rows = field.rows;
    if (field.maxlength) textarea.maxLength = field.maxlength;
    if (field.placeholder) textarea.placeholder = field.placeholder;
    return textarea;
  }

  function createSelect(field) {
    const select = document.createElement('select');
    select.id = field.id;
    select.name = field.id;
    select.className = 'form-control';
    if (field.required) select.required = true;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Please select --';
    select.appendChild(defaultOption);

    field.options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option;
      select.appendChild(opt);
    });

    return select;
  }

  function createRadio(field) {
    const container = document.createElement('div');
    container.className = 'radio-group';

    field.options.forEach((option, index) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'radio-label';

      const input = document.createElement('input');
      input.type = 'radio';
      input.id = `${field.id}_${index}`;
      input.name = field.id;
      input.value = option;
      if (field.required) input.required = true;

      wrapper.appendChild(input);
      wrapper.appendChild(document.createTextNode(' ' + option));
      container.appendChild(wrapper);
    });

    return container;
  }

  function createCheckboxGroup(field) {
    const container = document.createElement('div');
    container.className = 'checkbox-group';
    
    // Add compact grid for days of week
    if (field.id === 'availability_days') {
      container.classList.add('checkbox-grid');
      
      // Add select all button
      const selectAllBtn = document.createElement('button');
      selectAllBtn.type = 'button';
      selectAllBtn.className = 'btn btn-sm';
      selectAllBtn.textContent = 'Select All';
      selectAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
        selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
        validateForm();
      });
      container.appendChild(selectAllBtn);
    }

    field.options.forEach((option, index) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'checkbox-label';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `${field.id}_${index}`;
      input.name = field.id;
      input.value = option;

      wrapper.appendChild(input);
      wrapper.appendChild(document.createTextNode(' ' + option));
      container.appendChild(wrapper);
    });

    return container;
  }

  function createSingleCheckbox(field) {
    const wrapper = document.createElement('label');
    wrapper.className = 'checkbox-single';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = field.id;
    input.name = field.id;
    if (field.required) input.required = true;
    
    const labelText = document.createElement('span');
    labelText.textContent = field.label + (field.required ? ' *' : '');
    
    wrapper.appendChild(input);
    wrapper.appendChild(labelText);
    
    return wrapper;
  }

  function createFileInput(field) {
    const container = document.createElement('div');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.id = field.id;
    input.name = field.id;
    input.className = 'form-control';
    if (field.required) input.required = true;
    if (field.accept) input.accept = field.accept;
    if (field.multiple) input.multiple = true;
    
    const preview = document.createElement('div');
    preview.className = 'file-preview';
    preview.id = `${field.id}_preview`;
    
    input.addEventListener('change', (e) => {
      handleFileUpload(field, e.target.files, preview);
    });
    
    container.appendChild(input);
    container.appendChild(preview);
    return container;
  }

  function handleFileUpload(field, files, preview) {
    preview.innerHTML = '';
    
    if (!files || files.length === 0) {
      delete uploadedFiles[field.id];
      return;
    }
    
    const maxFiles = field.max || (field.multiple ? 10 : 1);
    const fileArray = Array.from(files).slice(0, maxFiles);
    
    uploadedFiles[field.id] = fileArray;
    
    fileArray.forEach(file => {
      const item = document.createElement('div');
      item.className = 'file-item';
      item.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      preview.appendChild(item);
    });
    
    validateForm();
  }

  function validateForm() {
    const formDefinition = getCurrentFormDefinition();
    if (!formDefinition) return false;

    let isValid = true;
    const errors = [];

    // Check conditional fields
    contractorForm.querySelectorAll('[data-conditional]').forEach(group => {
      const condition = JSON.parse(group.getAttribute('data-conditional'));
      const dependentField = contractorForm.querySelector(`[name="${condition.field}"]`);
      
      let showField = false;
      if (dependentField) {
        if (dependentField.type === 'radio') {
          const checked = contractorForm.querySelector(`[name="${condition.field}"]:checked`);
          showField = checked && checked.value === condition.value;
        }
      }
      
      group.style.display = showField ? '' : 'none';
    });

    // Validate required fields
    formDefinition.sections.forEach(section => {
      section.fields.forEach(field => {
        if (!field.required) return;
        
        const group = contractorForm.querySelector(`[data-field-id="${field.id}"]`);
        if (group && group.style.display === 'none') return; // Skip hidden conditional fields

        if (field.type === 'toggle') {
          if (!formData[field.id]) {
            isValid = false;
            errors.push(`${field.label} is required`);
          }
        } else if (field.type === 'checkbox') {
          const checked = contractorForm.querySelectorAll(`[name="${field.id}"]:checked`);
          if (checked.length === 0) {
            isValid = false;
            errors.push(`Please select at least one ${field.label.toLowerCase()}`);
          }
        } else if (field.type === 'checkbox_single') {
          const checkbox = contractorForm.querySelector(`#${field.id}`);
          if (!checkbox || !checkbox.checked) {
            isValid = false;
            errors.push(`You must agree to ${field.label.toLowerCase()}`);
          }
        } else if (field.type === 'file') {
          if (!uploadedFiles[field.id] || uploadedFiles[field.id].length === 0) {
            isValid = false;
            errors.push(`${field.label} is required`);
          }
        } else {
          const input = contractorForm.querySelector(`#${field.id}, [name="${field.id}"]:checked`);
          if (!input || !input.value || input.value.trim() === '') {
            isValid = false;
            errors.push(`${field.label} is required`);
          }
        }
      });
    });

    if (contractorSubmit) {
      contractorSubmit.disabled = !isValid;
    }

    return isValid;
  }

  function setError(msg) {
    if (contractorErrors) contractorErrors.textContent = msg;
  }

  function clearErrors() {
    if (contractorErrors) contractorErrors.textContent = '';
  }

  // Collect form data in the appropriate schema format
  function collectFormData() {
    if (currentEntityType === 'Sole Trader') {
      return collectSoleTraderData();
    } else {
      return collectCompanyData();
    }
  }
  
  function collectSoleTraderData() {
    const data = {
      id: generateContractorId(),
      entity_type: 'Sole Trader',
      personal_info: {
        full_name: contractorForm.full_name?.value || '',
        phone: contractorForm.phone?.value || '',
        email: contractorForm.email?.value || '',
        address: contractorForm.address?.value || '',
        id_verification: uploadedFiles.id_verification ? 'uploaded' : null
      },
      professional_details: {
        primary_trade: contractorForm.primary_trade?.value || '',
        years_experience: parseInt(contractorForm.years_experience?.value) || 0,
        certifications: uploadedFiles.certifications ? uploadedFiles.certifications.map(f => ({
          name: f.name,
          document_url: 'pending-upload'
        })) : [],
        insurance: {
          has_insurance: contractorForm.querySelector('[name="has_insurance"]:checked')?.value === 'Yes',
          document_url: uploadedFiles.insurance_document ? 'pending-upload' : null
        },
        service_area: Array.from(contractorForm.querySelectorAll('[name="service_area"]:checked')).map(cb => cb.value)
      },
      work_preferences: {
        job_types: Array.from(contractorForm.querySelectorAll('[name="job_types"]:checked')).map(cb => cb.value),
        availability: {
          days: Array.from(contractorForm.querySelectorAll('[name="availability_days"]:checked')).map(cb => cb.value),
          hours: contractorForm.availability_hours?.value || ''
        },
        emergency_service: contractorForm.querySelector('[name="emergency_service"]:checked')?.value === 'Yes'
      },
      portfolio: {
        images: uploadedFiles.portfolio_images || [],
        description: contractorForm.portfolio_description?.value || ''
      },
      references: [],
      compliance: {
        background_check_consent: contractorForm.background_check_consent?.checked || false,
        terms_agreed: contractorForm.terms_agreed?.checked || false
      },
      initial_score: 0,
      created_at: new Date().toISOString()
    };

    // Add references if provided
    if (contractorForm.reference1_name?.value) {
      data.references.push({
        name: contractorForm.reference1_name.value,
        contact: contractorForm.reference1_contact?.value || ''
      });
    }
    if (contractorForm.reference2_name?.value) {
      data.references.push({
        name: contractorForm.reference2_name.value,
        contact: contractorForm.reference2_contact?.value || ''
      });
    }

    return data;
  }
  
  function collectCompanyData() {
    const data = {
      id: generateContractorId(),
      entity_type: 'Company',
      company_info: {
        business_name: contractorForm.business_name?.value || '',
        registration_number: contractorForm.registration_number?.value || '',
        contact_person: {
          name: contractorForm.contact_person_name?.value || '',
          role: contractorForm.contact_person_role?.value || ''
        },
        phone: contractorForm.phone?.value || '',
        email: contractorForm.email?.value || '',
        address: contractorForm.address?.value || '',
        website: contractorForm.website?.value || ''
      },
      credentials: {
        business_license: uploadedFiles.business_license ? 'uploaded' : null,
        insurance: uploadedFiles.insurance ? 'uploaded' : null,
        certifications: uploadedFiles.certifications ? uploadedFiles.certifications.map(f => ({
          name: f.name,
          document_url: 'pending-upload'
        })) : []
      },
      workforce: {
        employee_count: parseInt(contractorForm.employee_count?.value) || 0,
        trades_covered: Array.from(contractorForm.querySelectorAll('[name="trades_covered"]:checked')).map(cb => cb.value),
        uses_subcontractors: contractorForm.querySelector('[name="uses_subcontractors"]:checked')?.value === 'Yes'
      },
      services: {
        job_types: Array.from(contractorForm.querySelectorAll('[name="job_types"]:checked')).map(cb => cb.value),
        service_area: Array.from(contractorForm.querySelectorAll('[name="service_area"]:checked')).map(cb => cb.value),
        emergency_service: contractorForm.querySelector('[name="emergency_service"]:checked')?.value === 'Yes'
      },
      portfolio: uploadedFiles.portfolio_images ? uploadedFiles.portfolio_images.map((img, idx) => ({
        project_name: `Project ${idx + 1}`,
        images: ['pending-upload']
      })) : [],
      portfolio_description: contractorForm.portfolio_description?.value || '',
      references: [],
      compliance: {
        background_check_consent: contractorForm.background_check_consent?.checked || false,
        terms_agreed: contractorForm.terms_agreed?.checked || false
      },
      initial_score: 0,
      created_at: new Date().toISOString()
    };

    // Add references if provided
    [1, 2, 3].forEach(num => {
      const nameField = contractorForm[`reference${num}_name`];
      const contactField = contractorForm[`reference${num}_contact`];
      if (nameField?.value) {
        data.references.push({
          name: nameField.value,
          contact: contactField?.value || ''
        });
      }
    });

    return data;
  }

  function generateContractorId() {
    return 'contractor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Handle form submission
  contractorForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    if (!validateForm()) {
      setError('Please complete all required fields.');
      return;
    }

    const contractorData = collectFormData();
    console.log('Contractor registration data:', contractorData);

    // Save to localStorage for now (later: send to server)
    try {
      const contractors = JSON.parse(localStorage.getItem('fitouthub_contractors') || '[]');
      contractors.push(contractorData);
      localStorage.setItem('fitouthub_contractors', JSON.stringify(contractors));
      
      alert('Contractor registration submitted successfully! You will be notified once your application is reviewed.');
      
      // Close modal
      if (window.auth && typeof window.auth.closeContractor === 'function') {
        window.auth.closeContractor();
      }
    } catch (error) {
      console.error('Error saving contractor data:', error);
      setError('Failed to submit registration. Please try again.');
    }
  });

  // Initialize on load
  if (contractorForm) {
    loadFormDefinitions();
  }

})();
