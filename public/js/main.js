/* ===== Tag Input Behavior ===== */
(function () {
  const tagInput = document.getElementById('tagInput');
  const tagInputArea = document.getElementById('tagInputArea');
  const btnAddTag = document.getElementById('btnAddTag');

  if (tagInput && tagInputArea && btnAddTag) {
    btnAddTag.addEventListener('click', function () {
      const value = tagInput.value.trim();
      if (value) {
        addTag(value);
        tagInput.value = '';
      }
    });

    tagInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = tagInput.value.trim();
        if (value) {
          addTag(value);
          tagInput.value = '';
        }
      }
      // Remove last tag on Backspace if input is empty
      if (e.key === 'Backspace' && tagInput.value === '') {
        const pills = tagInputArea.querySelectorAll('.tag-pill');
        if (pills.length > 0) {
          pills[pills.length - 1].remove();
        }
      }
    });
  }

  function addTag(name) {
    if (!tagInputArea) return;

    // Prevent duplicate tags
    const existing = tagInputArea.querySelectorAll('input[name="tags"]');
    for (const inp of existing) {
      if (inp.value.toLowerCase() === name.toLowerCase()) return;
    }

    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.innerHTML = `
      ${escapeHtml(name)}
      <button type="button" class="tag-remove" onclick="removeTag(this)">×</button>
      <input type="hidden" name="tags" value="${escapeHtml(name)}">
    `;

    // Append to area
    tagInputArea.appendChild(pill);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose removeTag globally so inline onclick works
  window.removeTag = function (btn) {
    const pill = btn.closest('.tag-pill');
    if (pill) pill.remove();
  };
})();

/* ===== Image Preview (multi, akumulatif) ===== */
(function () {
  const imageInput = document.getElementById('imageInput');
  const previewGrid = document.getElementById('newImagePreviews');
  const uploadArea = document.getElementById('uploadArea');
  const uploadLabel = uploadArea ? uploadArea.querySelector('.upload-label') : null;
  const MAX = 3;

  if (!imageInput || !previewGrid) return;

  // Simpan file yang sudah dipilih
  let selectedFiles = [];

  function updateInput() {
    const dt = new DataTransfer();
    selectedFiles.forEach(f => dt.items.add(f));
    imageInput.files = dt.files;
  }

  function getExistingCount() {
    const existingGrid = document.getElementById('existingGrid');
    return existingGrid ? existingGrid.querySelectorAll('.existing-img-item').length : 0;
  }

  function updateLabel() {
    if (!uploadLabel) return;
    const existingCount = getExistingCount();
    const total = selectedFiles.length + existingCount;
    const remaining = MAX - total;
    
    const span = uploadLabel.querySelector('span');
    if (span) {
      span.textContent = remaining > 0
        ? `Upload Gambar (${total}/${MAX} — klik untuk tambah)`
        : `Maksimal ${MAX} gambar tercapai`;
    }
    uploadLabel.style.opacity = remaining > 0 ? '1' : '0.4';
    uploadLabel.style.pointerEvents = remaining > 0 ? 'auto' : 'none';
  }

  // Dengarkan event ketika gambar existing dihapus
  document.addEventListener('existingImageRemoved', updateLabel);

  function renderPreviews() {
    previewGrid.innerHTML = '';
    selectedFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const div = document.createElement('div');
        div.className = 'new-img-preview';
        div.innerHTML = `
          <img src="${e.target.result}" alt="preview">
          <button type="button" class="img-remove-btn" data-idx="${idx}" title="Hapus">×</button>
        `;
        div.querySelector('.img-remove-btn').addEventListener('click', function () {
          selectedFiles.splice(parseInt(this.dataset.idx), 1);
          updateInput();
          renderPreviews();
          updateLabel();
        });
        previewGrid.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
    updateLabel();
  }

  imageInput.addEventListener('change', function () {
    const newFiles = Array.from(this.files);
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    for (const file of newFiles) {
      if (!allowed.includes(file.type)) {
        alert('Format tidak didukung: ' + file.name);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File terlalu besar (max 5MB): ' + file.name);
        continue;
      }
      const existingCount = getExistingCount();
      if (selectedFiles.length + existingCount >= MAX) {
        alert('Maksimal ' + MAX + ' gambar.');
        break;
      }
      selectedFiles.push(file);
    }
    // Reset input agar bisa pilih file yang sama lagi
    this.value = '';
    updateInput();
    renderPreviews();
  });

  /* Drag & Drop */
  if (uploadArea) {
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', function (e) {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const dt2 = new DataTransfer();
      Array.from(e.dataTransfer.files).forEach(f => dt2.items.add(f));
      imageInput.files = dt2.files;
      imageInput.dispatchEvent(new Event('change'));
    });
  }

  // Init label
  updateLabel();
})();

/* ===== Hapus gambar existing saat edit ===== */
window.removeExistingImage = function (btn) {
  const item = btn.closest('.existing-img-item');
  if (!item) return;
  // Hapus hidden input keep_images agar ID ini tidak dikirim
  const hidden = item.querySelector('input[name="keep_images"]');
  if (hidden) hidden.remove();
  // Tambah hidden input delete_images agar server tahu yang dihapus
  const noteForm = document.getElementById('noteForm');
  if (noteForm) {
    const del = document.createElement('input');
    del.type = 'hidden';
    del.name = 'delete_images';
    del.value = item.dataset.id;
    noteForm.appendChild(del);
  }
  item.remove();
  document.dispatchEvent(new Event('existingImageRemoved'));
};

/* ===== Link Input Behavior ===== */
(function () {
  const btnAdd = document.getElementById('btnAddLink');
  const linkInput = document.getElementById('linkInput');
  const linkList = document.getElementById('linkList');
  if (!btnAdd || !linkInput || !linkList) return;

  function addLink(url) {
    url = url.trim();
    if (!url) return;
    // Prevent duplicates
    const existing = linkList.querySelectorAll('input[name="links"]');
    for (const inp of existing) {
      if (inp.value === url) return;
    }
    const item = document.createElement('div');
    item.className = 'link-item';
    item.innerHTML = `
      <a href="${url}" target="_blank" class="link-url-text">${url}</a>
      <button type="button" class="tag-remove" onclick="removeLink(this)">×</button>
      <input type="hidden" name="links" value="${url}">
    `;
    linkList.appendChild(item);
    linkInput.value = '';
  }

  btnAdd.addEventListener('click', function () {
    addLink(linkInput.value);
  });

  linkInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLink(linkInput.value);
    }
  });

  window.removeLink = function (btn) {
    const item = btn.closest('.link-item');
    if (item) item.remove();
  };
})();
