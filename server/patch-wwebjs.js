/**
 * Automated hotfix patch for whatsapp-web.js to resolve WhatsApp Web's internal:
 * "Data passed to getter must include an id property (it's how we memoize) but got undefined"
 */
const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, 'node_modules/whatsapp-web.js/src/util/Injected/Utils.js');

if (fs.existsSync(utilsPath)) {
  let content = fs.readFileSync(utilsPath, 'utf8');

  // Check if patch already applied
  if (!content.includes('delete message.__x_id;')) {
    const target = 'delete message.canonicalUrl;\n        }';
    const replacement = 'delete message.canonicalUrl;\n        }\n\n        delete message.__x_id;\n        message.id = newMsgKey;';

    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(utilsPath, content, 'utf8');
      console.log('✅ Successfully patched whatsapp-web.js Utils.js (__x_id strip applied)');
    } else {
      console.log('⚠️ Target string not found in Utils.js for patching');
    }
  } else {
    console.log('ℹ️ whatsapp-web.js Utils.js is already patched');
  }
} else {
  console.log('⚠️ whatsapp-web.js not found in node_modules');
}

