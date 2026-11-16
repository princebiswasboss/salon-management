// Modal Management Module
export class Modal {
  static open({ title, content, footer, onOpen, onClose }) {
    let overlay = document.getElementById('global-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-modal';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 id="global-modal-title"></h3>
            <button class="btn-close-modal" id="global-modal-close" aria-label="Close modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body" id="global-modal-body"></div>
          <div class="modal-footer" id="global-modal-footer"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Close handlers
      overlay.querySelector('#global-modal-close').addEventListener('click', () => Modal.close());
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) Modal.close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
          Modal.close();
        }
      });
    }

    document.getElementById('global-modal-title').textContent = title || 'Details';
    const bodyEl = document.getElementById('global-modal-body');
    const footerEl = document.getElementById('global-modal-footer');

    if (typeof content === 'string') {
      bodyEl.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      bodyEl.innerHTML = '';
      bodyEl.appendChild(content);
    }

    if (footer) {
      footerEl.style.display = 'flex';
      if (typeof footer === 'string') {
        footerEl.innerHTML = footer;
      } else if (footer instanceof HTMLElement) {
        footerEl.innerHTML = '';
        footerEl.appendChild(footer);
      }
    } else {
      footerEl.style.display = 'none';
      footerEl.innerHTML = '';
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (onOpen) onOpen(overlay);
    Modal._onCloseCallback = onClose;
  }

  static close() {
    const overlay = document.getElementById('global-modal');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      if (Modal._onCloseCallback) {
        Modal._onCloseCallback();
        Modal._onCloseCallback = null;
      }
    }
  }
}
