// TODO(api-request #4): untyped on purpose — @catering/shared has no User/Me schema yet.
// Shape follows API_CONTRACT.md §2.2. Permission strings below are placeholders.
export const mockPassword = 'Passw0rd!';

export const mockUsers = [
  { id: 'clu_admin', name: 'ידידיה', email: 'admin@dev.local', role: 'ADMIN' },
  { id: 'clu_office', name: 'נועה', email: 'office@dev.local', role: 'OFFICE' },
  { id: 'clu_chef', name: 'שף יוסי', email: 'chef@dev.local', role: 'KITCHEN_MANAGER' },
  { id: 'clu_cook', name: 'דנה', email: 'cook@dev.local', role: 'KITCHEN_STAFF' },
  { id: 'clu_driver', name: 'אבי', email: 'driver@dev.local', role: 'DRIVER' }
];

export const mockPermissions: Record<string, string[]> = {
  ADMIN: ['orders:read', 'orders:write', 'users:write'],
  OFFICE: ['orders:read', 'orders:write'],
  KITCHEN_MANAGER: ['kitchen:read', 'kitchen:write'],
  KITCHEN_STAFF: ['kitchen:read'],
  DRIVER: ['deliveries:read']
};
