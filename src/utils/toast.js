// Simple Toast Notification Utility
let toastContainer = null;

// Create toast container if it doesn't exist
const createToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

// Show toast notification
export const toast = {
  success: (message) => showToast(message, 'success'),
  error: (message) => showToast(message, 'error'),
  info: (message) => showToast(message, 'info'),
  warning: (message) => showToast(message, 'warning')
};

const showToast = (message, type = 'info') => {
  const container = createToastContainer();
  
  const toastElement = document.createElement('div');
  toastElement.style.cssText = `
    background: ${getBackgroundColor(type)};
    color: white;
    padding: 12px 20px;
    margin-bottom: 10px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 400px;
    word-wrap: break-word;
    pointer-events: auto;
    cursor: pointer;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    border-left: 4px solid ${getBorderColor(type)};
  `;
  
  // Add icon based on type
  const icon = getIcon(type);
  toastElement.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">${icon}</span>
      <span>${message}</span>
    </div>
  `;
  
  container.appendChild(toastElement);
  
  // Animate in
  setTimeout(() => {
    toastElement.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto remove after 5 seconds
  const removeToast = () => {
    toastElement.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (container.contains(toastElement)) {
        container.removeChild(toastElement);
      }
    }, 300);
  };
  
  // Click to dismiss
  toastElement.addEventListener('click', removeToast);
  
  // Auto dismiss
  setTimeout(removeToast, 5000);
};

const getBackgroundColor = (type) => {
  switch (type) {
    case 'success': return '#10B981';
    case 'error': return '#EF4444';
    case 'warning': return '#F59E0B';
    case 'info': 
    default: return '#3B82F6';
  }
};

const getBorderColor = (type) => {
  switch (type) {
    case 'success': return '#059669';
    case 'error': return '#DC2626';
    case 'warning': return '#D97706';
    case 'info': 
    default: return '#2563EB';
  }
};

const getIcon = (type) => {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': 
    default: return 'ℹ️';
  }
};

export default toast;
