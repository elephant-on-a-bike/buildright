// dynamic-form.js
// Unified dynamic form builder for contractor/reseller (and admin edit modal)
(function(window){
  // Usage: dynamicForm.render({
  //   container: HTMLElement,
  //   definition: Object,
  //   prefix: 'contractor_' | 'reseller_' | 'edit_',
  //   initialData: Object (optional),
  //   onSubmit: function(data) {}
  // })

  function render({container, definition, prefix, initialData, onSubmit}) {
    if (!container || !definition) return;
    container.innerHTML = '';
    const form = document.createElement('form');
    form.className = 'dynamic-form';
    form.noValidate = true;
    const ctaActions = document.createElement('div');
    ctaActions.className = 'cta-actions';
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Update';
    ctaActions.appendChild(submitBtn);
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
      if (container.closest('.pd-modal')) {
        container.closest('.pd-modal').classList.remove('open');
        document.getElementById('editOverlay').setAttribute('aria-hidden', 'true');
      }
    };
    ctaActions.appendChild(cancelBtn);
    // Build sections
    definition.sections.forEach(section => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'form-section';
      sectionDiv.innerHTML = `<h3 class="section-title">${section.title}</h3>`;
      section.fields.forEach(field => {
        const fieldGroup = createField(field, prefix, initialData);
        if (fieldGroup) sectionDiv.appendChild(fieldGroup);
      });
      form.appendChild(sectionDiv);
    });
    form.appendChild(ctaActions);
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const data = collectFormData(form, definition, prefix);
      if (onSubmit) onSubmit(data);
    });
    container.appendChild(form);

      // Collapse-after-email: only apply on join pages, not edit modal
      // We use this to hide the large right-side image below the email field to reclaim width.
      // The previous logic applied in all contexts and removed branding in the edit modal.
      (function applyConditionalCollapse() {
          const hasEmailField = !!form.querySelector('[name="email"], #email, input[type="email"]');
          const inEditModal = !!document.querySelector('.pd-modal');
          const onJoinPage = !!document.querySelector('.join-content');
          if (hasEmailField && onJoinPage && !inEditModal) {
              const root = form.closest('.join-content') || document.body;
              root.classList.add('collapse-after-email');
          }
      })();
  }

  function createField(field, prefix, initialData) {
    const group = document.createElement('div');
    group.className = 'form-group';
    group.setAttribute('data-field-id', field.id);
    const label = document.createElement('label');
    label.className = 'form-label';
    label.htmlFor = prefix + field.id;
    label.textContent = field.label + (field.required ? ' *' : '');
    let input;
    let value = initialData && initialData[field.id] !== undefined ? initialData[field.id] : (field.default || '');
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        input = document.createElement('input');
        input.type = field.type;
        input.id = prefix + field.id;
        input.name = field.id;
        input.className = 'form-control';
        if (field.required) input.required = true;
        if (field.maxlength) input.maxLength = field.maxlength;
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.pattern) input.pattern = field.pattern;
        input.value = value;
        break;
      case 'number':
        input = document.createElement('input');
        input.type = 'number';
        input.id = prefix + field.id;
        input.name = field.id;
        input.className = 'form-control';
        if (field.required) input.required = true;
        if (field.min !== undefined) input.min = field.min;
        if (field.max !== undefined) input.max = field.max;
        if (field.placeholder) input.placeholder = field.placeholder;
        input.value = value;
        break;
      case 'textarea':
        input = document.createElement('textarea');
        input.id = prefix + field.id;
        input.name = field.id;
        input.className = 'form-control';
        if (field.required) input.required = true;
        if (field.rows) input.rows = field.rows;
        if (field.maxlength) input.maxLength = field.maxlength;
        if (field.placeholder) input.placeholder = field.placeholder;
        input.value = value;
        break;
      case 'select':
        // Use button grid for selects with many options (like trades)
        if (field.options && field.options.length > 8) {
          input = document.createElement('div');
          input.className = 'radio-group radio-buttons';
          field.options.forEach((option, idx) => {
            const wrapper = document.createElement('label');
            wrapper.className = 'radio-button';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = `${prefix}${field.id}_${idx}`;
            radio.name = field.id;
            radio.value = option;
            radio.style.display = 'none';
            if (field.required) radio.required = true;
            const span = document.createElement('span');
            span.textContent = option;
            if (value === option) {
              radio.checked = true;
              wrapper.classList.add('active');
            }
            wrapper.addEventListener('click', (e) => {
              // Clear all siblings and set this one
              const siblings = wrapper.parentElement.querySelectorAll('.radio-button');
              siblings.forEach(sib => sib.classList.remove('active'));
              wrapper.classList.add('active');
              radio.checked = true;
              e.preventDefault();
            });
            wrapper.appendChild(radio);
            wrapper.appendChild(span);
            input.appendChild(wrapper);
          });
        } else {
          // Standard dropdown for small selects
          input = document.createElement('select');
          input.id = prefix + field.id;
          input.name = field.id;
          input.className = 'form-control';
          if (field.required) input.required = true;
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = '-- Please select --';
          input.appendChild(defaultOption);
          field.options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            if (value && option === value) {
              opt.selected = true;
            }
            input.appendChild(opt);
          });
        }
        break;
      case 'radio':
        input = document.createElement('div');
        input.className = 'radio-group';
        field.options.forEach((option, idx) => {
          const wrapper = document.createElement('label');
          wrapper.className = 'radio-label';
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.id = `${prefix}${field.id}_${idx}`;
          radio.name = field.id;
          radio.value = option;
          if (field.required) radio.required = true;
          if (value === option) radio.checked = true;
          wrapper.appendChild(radio);
          wrapper.appendChild(document.createTextNode(' ' + option));
          input.appendChild(wrapper);
        });
        break;
      case 'checkbox':
        input = document.createElement('div');
        input.className = 'checkbox-group checkbox-buttons';
        let checkedValues = Array.isArray(value) ? value : [];
        field.options.forEach((option, idx) => {
          const wrapper = document.createElement('label');
          wrapper.className = 'checkbox-button';
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `${prefix}${field.id}_${idx}`;
          checkbox.name = field.id;
          checkbox.value = option;
          checkbox.style.display = 'none';
          const span = document.createElement('span');
          span.textContent = option;
          if (checkedValues.includes(option)) {
            checkbox.checked = true;
            wrapper.classList.add('active');
          }
          wrapper.addEventListener('click', (e) => {
            // Toggle checked and active state
            checkbox.checked = !checkbox.checked;
            wrapper.classList.toggle('active', checkbox.checked);
            e.preventDefault();
          });
          wrapper.appendChild(checkbox);
          wrapper.appendChild(span);
          input.appendChild(wrapper);
        });
        break;
      case 'checkbox_single':
        input = document.createElement('label');
        input.className = 'checkbox-single';
        const singleCheckbox = document.createElement('input');
        singleCheckbox.type = 'checkbox';
        singleCheckbox.id = prefix + field.id;
        singleCheckbox.name = field.id;
        if (field.required) singleCheckbox.required = true;
        if (value) singleCheckbox.checked = true;
        const labelText = document.createElement('span');
        labelText.textContent = field.label + (field.required ? ' *' : '');
        input.appendChild(singleCheckbox);
        input.appendChild(labelText);
        break;
      case 'file':
        input = document.createElement('input');
        input.type = 'file';
        input.id = prefix + field.id;
        input.name = field.id;
        input.className = 'form-control';
        if (field.required) input.required = true;
        if (field.accept) input.accept = field.accept;
        if (field.multiple) input.multiple = true;
        break;
      default:
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

  function collectFormData(form, definition, prefix) {
    const data = {};
    definition.sections.forEach(section => {
      section.fields.forEach(field => {
        let value;
        switch (field.type) {
          case 'checkbox':
            value = Array.from(form.querySelectorAll(`.checkbox-buttons [name="${field.id}"]`))
              .filter(cb => cb.checked)
              .map(cb => cb.value);
            break;
          case 'checkbox_single':
            value = form.querySelector(`#${prefix}${field.id}`)?.checked || false;
            break;
          case 'radio':
            value = form.querySelector(`[name="${field.id}"]:checked`)?.value || '';
            break;
          case 'select':
            // Handle both standard selects and button-grid radio selects
            const selectEl = form.querySelector(`#${prefix}${field.id}`);
            if (selectEl) {
              value = selectEl.value || '';
            } else {
              // Button grid version
              value = form.querySelector(`.radio-buttons [name="${field.id}"]:checked`)?.value || '';
            }
            break;
          case 'file':
            value = form.querySelector(`#${prefix}${field.id}`)?.files || null;
            break;
          default:
            value = form.querySelector(`#${prefix}${field.id}`)?.value || '';
        }
        data[field.id] = value;
      });
    });
    return data;
  }

  window.dynamicForm = { render };
})(window);
