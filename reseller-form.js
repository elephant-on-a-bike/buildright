(function(){
  const resellerForm = document.getElementById('resellerForm');
  const resellerErrors = document.getElementById('resellerErrors');
  const resellerSubmit = document.getElementById('resellerSubmit');
  const resellerCancel = document.getElementById('resellerCancel');
  
  let formDefinition = null;
  let formData = {};
  let uploadedFiles = {};

  // Load form definition
  async function loadFormDefinition() {
    try {
      const response = await fetch('reseller-form.json');
      if (!response.ok) throw new Error('Failed to load form definition');
      formDefinition = await response.json();
      buildForm();
    } catch (error) {
      console.error('Error loading reseller form:', error);
      setError('Unable to load registration form. Please try again later.');
    }
  }

  // Build the form dynamically (reusing same logic as contractor form)
  function buildForm() {
    if (!resellerForm || !formDefinition) return;
    
    const existingFields = resellerForm.querySelectorAll('.form-section');
    existingFields.forEach(el => el.remove());

    const ctaActions = resellerForm.querySelector('.cta-actions');

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

      resellerForm.insertBefore(sectionDiv, ctaActions);
    });

    resellerForm.addEventListener('input', validateForm);
    resellerForm.addEventListener('change', validateForm);
  }

  // Field creation functions (same as contractor-form.js)
  function createField(field) {
    const group = document.createElement('div');
    group.className = 'form-group';
    group.setAttribute('data-field-id', field.id);

    if (field.conditionalOn) {
      group.style.display = 'none';
      group.setAttribute('data-conditional', JSON.stringify(field.conditionalOn));
    }

    const label = document.createElement('label');
    label.className = 'form-label';
    label.htmlFor = 'reseller_' + field.id;
    label.textContent = field.label + (field.required ? ' *' : '');

    let input;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
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
      group.appendChild(input);
    } else if (field.type === 'radio' || field.type === 'checkbox') {
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

  function createTextInput(field) {
    const input = document.createElement('input');
    input.type = field.type;
    input.id = 'reseller_' + field.id;
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
    input.id = 'reseller_' + field.id;
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
    textarea.id = 'reseller_' + field.id;
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
    select.id = 'reseller_' + field.id;
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
      input.id = `reseller_${field.id}_${index}`;
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

    field.options.forEach((option, index) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'checkbox-label';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `reseller_${field.id}_${index}`;
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
    input.id = 'reseller_' + field.id;
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
    input.id = 'reseller_' + field.id;
    input.name = field.id;
    input.className = 'form-control';
    if (field.required) input.required = true;
    if (field.accept) input.accept = field.accept;
    if (field.multiple) input.multiple = true;
    
    const preview = document.createElement('div');
    preview.className = 'file-preview';
    preview.id = `reseller_${field.id}_preview`;
    
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
    if (!formDefinition) return false;

    let isValid = true;

    formDefinition.sections.forEach(section => {
      section.fields.forEach(field => {
        if (!field.required) return;
        
        const group = resellerForm.querySelector(`[data-field-id="${field.id}"]`);
        if (group && group.style.display === 'none') return;

        if (field.type === 'checkbox') {
          const checked = resellerForm.querySelectorAll(`[name="${field.id}"]:checked`);
          if (checked.length === 0) {
            isValid = false;
          }
        } else if (field.type === 'checkbox_single') {
          const checkbox = resellerForm.querySelector(`#${field.id}`);
          if (!checkbox || !checkbox.checked) {
            isValid = false;
          }
        } else if (field.type === 'file') {
          if (!uploadedFiles[field.id] || uploadedFiles[field.id].length === 0) {
            isValid = false;
          }
        } else {
          const input = resellerForm.querySelector(`#${field.id}, [name="${field.id}"]:checked`);
          if (!input || !input.value || input.value.trim() === '') {
            isValid = false;
          }
        }
      });
    });

    if (resellerSubmit) {
      resellerSubmit.disabled = !isValid;
    }

    return isValid;
  }

  function setError(msg) {
    if (resellerErrors) resellerErrors.textContent = msg;
  }

  function clearErrors() {
    if (resellerErrors) resellerErrors.textContent = '';
  }

  function collectFormData() {
    const data = {
      id: generateResellerId(),
      business_info: {
        business_name: resellerForm.business_name?.value || '',
        registration_number: resellerForm.registration_number?.value || '',
        contact_person: {
          name: resellerForm.contact_person_name?.value || '',
          role: resellerForm.contact_person_role?.value || ''
        },
        phone: resellerForm.phone?.value || '',
        email: resellerForm.email?.value || '',
        address: resellerForm.address?.value || '',
        website: resellerForm.website?.value || ''
      },
      credentials: {
        business_license: uploadedFiles.business_license ? 'uploaded' : null,
        tax_certificate: uploadedFiles.tax_certificate ? 'uploaded' : null,
        insurance: uploadedFiles.insurance ? 'uploaded' : null
      },
      product_categories: Array.from(resellerForm.querySelectorAll('[name="product_categories"]:checked')).map(cb => cb.value),
      product_catalog: uploadedFiles.product_catalog ? 'uploaded' : null,
      brands_carried: resellerForm.brands_carried?.value || '',
      service_details: {
        delivery_available: resellerForm.querySelector('[name="delivery_available"]:checked')?.value === 'Yes',
        installation_services: resellerForm.querySelector('[name="installation_services"]:checked')?.value === 'Yes',
        service_area: Array.from(resellerForm.querySelectorAll('[name="service_area"]:checked')).map(cb => cb.value),
        minimum_order: parseInt(resellerForm.minimum_order?.value) || null,
        payment_terms: resellerForm.payment_terms?.value || ''
      },
      portfolio: uploadedFiles.portfolio_images ? uploadedFiles.portfolio_images.map((img, idx) => ({
        project_name: `Showcase ${idx + 1}`,
        images: ['pending-upload']
      })) : [],
      portfolio_description: resellerForm.portfolio_description?.value || '',
      references: [],
      compliance: {
        background_check_consent: resellerForm.background_check_consent?.checked || false,
        terms_agreed: resellerForm.terms_agreed?.checked || false
      },
      initial_score: 0,
      created_at: new Date().toISOString()
    };

    // Add references if provided
    [1, 2].forEach(num => {
      const nameField = resellerForm[`reference${num}_name`];
      const contactField = resellerForm[`reference${num}_contact`];
      if (nameField?.value) {
        data.references.push({
          name: nameField.value,
          contact: contactField?.value || ''
        });
      }
    });

    return data;
  }

  function generateResellerId() {
    return 'reseller_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Handle form submission
  resellerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    if (!validateForm()) {
      setError('Please complete all required fields.');
      return;
    }

    const resellerData = collectFormData();
    
    // Add metadata
    const professionalRecord = {
      id: 'reseller_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type: 'reseller', // contractor, reseller
      businessType: 'company', // resellers are always companies
      registrationDate: new Date().toISOString(),
      status: 'pending', // pending, approved, rejected
      data: resellerData
    };

    console.log('Reseller registration:', professionalRecord);

    try {
      // Save to unified professionals database via ProfessionalsDB
      if (window.ProfessionalsDB) {
        window.ProfessionalsDB.add(professionalRecord);
      } else {
        // Fallback to direct localStorage if ProfessionalsDB not loaded
        const professionals = JSON.parse(localStorage.getItem('fitouthub_professionals') || '[]');
        professionals.push(professionalRecord);
        localStorage.setItem('fitouthub_professionals', JSON.stringify(professionals));
      }
      
      // Show success confirmation in the form
      const formContainer = resellerForm.closest('.join-form-wrapper');
      if (formContainer) {
        const leftPanel = formContainer.querySelector('.join-form-left');
        if (leftPanel) {
          leftPanel.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 2rem;text-align:center;min-height:400px;">
              <img src="assets/check-mark.gif" alt="Success" style="width:120px;height:120px;margin-bottom:1.5rem;" />
              <h3 style="font-size:1.5rem;color:#10B981;margin:0 0 0.5rem;">Registration Submitted!</h3>
              <p style="color:#6B7280;margin:0 0 1.5rem;">Your reseller registration has been received. You will be notified once reviewed.</p>
              <a href="index.html" class="btn btn-primary">Return to Home</a>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Error saving reseller data:', error);
      setError('Failed to submit registration. Please try again.');
    }
  });

  // Initialize on load
  if (resellerForm) {
    loadFormDefinition();
  }

})();
