export function isIPv4Address(ip: string) {
  return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ip)
}

export function isIPv6Address(ip: string) {
  return /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}(\/\d{1,3})?$/.test(ip)
}

export function isIPAddress(ip: string) {
  return isIPv4Address(ip) || isIPv6Address(ip)
}