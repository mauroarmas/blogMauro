import { BlockList, isIP } from 'node:net';

const blocked = new BlockList();
for (const [network, prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.168.0.0',16],['224.0.0.0',4],['240.0.0.0',4]]) blocked.addSubnet(network,prefix,'ipv4');
for (const [network, prefix] of [['::',128],['::1',128],['fc00::',7],['fe80::',10],['ff00::',8]]) blocked.addSubnet(network,prefix,'ipv6');

/** Clasificación conservadora sin DNS ni conexiones a destinos. */
export function classifyLink(input, { base, restricted = false } = {}) {
  let url;
  try { url = base ? new URL(input, base) : new URL(input); } catch { return { classification: 'invalid', url: null, reason: 'URL inválida o relativa sin base.' }; }
  if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) || url.username || url.password) return { classification: 'invalid', url: null, reason: 'Protocolo o credenciales no permitidos.' };
  if (url.protocol === 'mailto:' || url.protocol === 'tel:') {
    let address;
    try { address = decodeURIComponent(url.pathname); } catch { return { classification: 'invalid', url: null, reason: 'Contacto inválido.' }; }
    if (!address || /[\r\n]/.test(address)) return { classification: 'invalid', url: null, reason: 'Contacto inválido.' };
    return { classification: 'contact', url: url.href, reason: null };
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  const family = isIP(host);
  if ((family && blocked.check(host, family === 4 ? 'ipv4' : 'ipv6')) || (!family && (!host.includes('.') || /(?:^|\.)(localhost|local|internal|test|invalid)$/.test(host)))) return { classification: 'local', url: url.href, reason: 'Destino local o privado.' };
  if (restricted) return { classification: 'restricted', url: url.href, reason: 'El propietario indicó que requiere acceso restringido.' };
  return { classification: 'needs_check', url: url.href, reason: /(?:^|\.)ts\.net$/.test(host) ? 'Puede requerir acceso a una red privada.' : 'Verificar acceso del destinatario.' };
}

export function linksReady(checks) {
  return checks.every(item => item.classification === 'contact' || (item.classification === 'needs_check' && item.recipientAccessConfirmed === true && Boolean(item.confirmedAt)));
}
