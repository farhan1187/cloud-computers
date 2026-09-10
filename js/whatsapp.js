/**
 * CLOUD COMPUTERS - WhatsApp Service Integration Engine
 * 
 * Centralized UAE business WhatsApp configuration and direct inquiry dispatcher.
 * Easily update the phone number below to connect to any business line.
 */

const CLOUD_WHATSAPP_CONFIG = {
  // UAE WhatsApp Business Phone Number (International format without leading '+' or special chars)
  // Default demo number: 971501234567. Change this value to your active UAE WhatsApp number.
  phone: '971501234567',
  displayPhone: '+971 50 123 4567',
  companyName: 'Cloud Computers',
  city: 'Dubai / UAE',

  // Service-specific templates
  serviceTemplates: {
    'Networking': 'Enterprise Multi-WAN Routing, 10G Switching & VLAN Architecture',
    'PC Sales & Services': 'High-Performance Workstations, Laptops & Commercial Hardware',
    'Printer Solutions': 'Commercial Heavy-Duty Printing & Managed Print Services',
    'Cabling': 'Certified Structured Cabling & Fiber Optic Splicing (Cat6A / OM4)',
    'IT Solutions': 'Enterprise Cloud Infrastructure, SAN Storage & Disaster Recovery',
    'Access & Security': 'SIRA-Compliant Biometric Access Control, CCTV & Surveillance',
    'Wi-Fi Solutions': 'High-Density Enterprise Wi-Fi 6/7 Deployment & Seamless Roaming',
    'Technical Support': '24/7 Dedicated IT Managed Support & Annual Maintenance Contract (AMC)'
  }
};

/**
 * Builds standard WhatsApp Web / App direct deep-link
 */
function buildWhatsAppUrl(messageText) {
  const encoded = encodeURIComponent(messageText.trim());
  return `https://wa.me/${CLOUD_WHATSAPP_CONFIG.phone}?text=${encoded}`;
}

/**
 * Opens WhatsApp in a new tab/app window
 */
function launchWhatsApp(messageText) {
  const url = buildWhatsAppUrl(messageText);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Generates an inquiry message for a specific IT service
 */
function inquireServiceViaWhatsApp(serviceName) {
  const serviceDetail = CLOUD_WHATSAPP_CONFIG.serviceTemplates[serviceName] || serviceName;
  const message = 
`*⚡ IT Service Inquiry — ${CLOUD_WHATSAPP_CONFIG.companyName}*
━━━━━━━━━━━━━━━━━━━━━━━━
👋 Hello Team,

I am interested in your *${serviceName}* services:
_${serviceDetail}_

Please share technical details, pricing, and available timeline for our site.
━━━━━━━━━━━━━━━━━━━━━━━━
📍 _Inquiry from Cloud Computers Website_`;

  launchWhatsApp(message);
}

/**
 * Dispatches a detailed consultation quote request via WhatsApp
 */
function dispatchQuoteViaWhatsApp({ name, email, phone, service, notes }) {
  const message = 
`*🚀 New IT Consultation Request — ${CLOUD_WHATSAPP_CONFIG.companyName}*
━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Client Name:* ${name || 'Prospective Client'}
💼 *Work Email:* ${email || 'Not provided'}
📞 *Phone / Mobile:* ${phone || 'Not provided'}
🛠️ *Service Required:* ${service || 'General IT Consultation'}
📝 *Project Scope / Site Details:*
${notes ? notes : 'Site survey and infrastructure assessment required.'}
━━━━━━━━━━━━━━━━━━━━━━━━
⚡ _Immediate response requested via WhatsApp_`;

  launchWhatsApp(message);
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // 1. Bind all elements with [data-wa-service]
  const serviceWaBtns = document.querySelectorAll('[data-wa-service]');
  serviceWaBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const serviceName = btn.getAttribute('data-wa-service');
      inquireServiceViaWhatsApp(serviceName);
    });
  });

  // 2. Bind floating WhatsApp widget link
  const floatLink = document.getElementById('wa-float-link');
  if (floatLink) {
    floatLink.setAttribute('href', buildWhatsAppUrl(
      `Hello ${CLOUD_WHATSAPP_CONFIG.companyName}, I would like to speak with an IT infrastructure engineer regarding our requirements.`
    ));
  }

  // 3. Bind direct hero WhatsApp button if present
  const heroWaBtn = document.getElementById('hero-wa-btn');
  if (heroWaBtn) {
    heroWaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      launchWhatsApp(
        `Hello ${CLOUD_WHATSAPP_CONFIG.companyName}, I would like to schedule an IT infrastructure consultation and site audit.`
      );
    });
  }
});
