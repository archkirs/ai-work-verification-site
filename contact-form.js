(() => {
  const form = document.querySelector('#contact-form');
  const copyButton = document.querySelector('[data-copy-email]');
  const copyStatus = document.querySelector('.copy-status');

  if (copyButton && copyStatus) {
    copyButton.addEventListener('click', async () => {
      const email = copyButton.getAttribute('data-copy-email');
      try {
        await navigator.clipboard.writeText(email);
        copyStatus.textContent = 'Email address copied.';
      } catch (error) {
        const input = document.createElement('input');
        input.value = email;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        input.remove();
        copyStatus.textContent = copied ? 'Email address copied.' : 'Copy failed. Select the email address above.';
      }
    });
  }

  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');
  const fields = ['name', 'email', 'topic', 'message'];
  let requestId = null;

  function makeRequestId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
  }

  function clearErrors() {
    fields.forEach((name) => {
      const field = form.elements[name];
      const error = form.querySelector(`[data-error-for="${name}"]`);
      if (field) field.removeAttribute('aria-invalid');
      if (error) error.textContent = '';
    });
  }

  function showErrors(errors = {}) {
    clearErrors();
    let firstInvalid = null;

    Object.entries(errors).forEach(([name, message]) => {
      if (!fields.includes(name)) return;
      const field = form.elements[name];
      const error = form.querySelector(`[data-error-for="${name}"]`);
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        if (!firstInvalid) firstInvalid = field;
      }
      if (error) error.textContent = message;
    });

    if (firstInvalid) firstInvalid.focus();
  }

  function validateClient() {
    const errors = {};
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const topic = form.elements.topic.value;
    const message = form.elements.message.value.trim();

    if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.';

    if (!email) errors.email = 'Please enter your email address.';
    else if (email.length > 254) errors.email = 'Email must be 254 characters or fewer.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!['general', 'pilot', 'privacy', 'other'].includes(topic)) {
      errors.topic = 'Please select a topic.';
    }

    if (!message) errors.message = 'Please enter a message.';
    else if (message.length > 3000) {
      errors.message = 'Message must be 3,000 characters or fewer. Please shorten it and try again.';
    }

    return errors;
  }

  function setPending(pending) {
    submitButton.disabled = pending;
    submitButton.setAttribute('aria-disabled', pending ? 'true' : 'false');
    submitButton.textContent = pending ? 'Sending…' : 'Send message';
  }

  fields.forEach((name) => {
    form.elements[name].addEventListener('input', () => {
      const error = form.querySelector(`[data-error-for="${name}"]`);
      form.elements[name].removeAttribute('aria-invalid');
      if (error) error.textContent = '';
      requestId = null;
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();
    status.className = 'form-status';
    status.textContent = '';

    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      status.classList.add('is-error');
      status.textContent = 'Please check the highlighted fields.';
      requestId = null;
      return;
    }

    if (!requestId) requestId = makeRequestId();

    const payload = {
      request_id: requestId,
      name: form.elements.name.value,
      email: form.elements.email.value,
      topic: form.elements.topic.value,
      message: form.elements.message.value,
      website: form.elements.website.value,
    };

    setPending(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (error) {
        data = {};
      }

      if (response.ok && data.ok) {
        form.reset();
        requestId = null;
        status.classList.add('is-success');
        status.textContent = data.message || 'Thank you. Your message has been sent to the AsMade team. We will reply to the email address you provided if a response is needed.';
        return;
      }

      if (response.status === 422 && data.errors) {
        showErrors(data.errors);
        requestId = null;
        status.classList.add('is-error');
        status.textContent = data.errors.form || data.message || 'Please check the highlighted fields.';
        return;
      }

      if (response.status === 413) {
        requestId = null;
        status.classList.add('is-error');
        status.textContent = 'Your message is too large. Please shorten it.';
        return;
      }

      if (response.status === 429) {
        requestId = null;
        status.classList.add('is-error');
        status.textContent = 'Too many attempts. Please try again later.';
        return;
      }

      if (response.status < 500) requestId = null;
      status.classList.add('is-error');
      status.textContent = data.message || 'We could not send your message. Please try again later or email hello@useasmade.com.';
    } catch (error) {
      status.classList.add('is-error');
      status.textContent = 'We could not send your message. Please try again later or email hello@useasmade.com.';
    } finally {
      setPending(false);
    }
  });
})();
