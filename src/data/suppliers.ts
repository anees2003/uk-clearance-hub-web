export interface Supplier {
  /** Internal supplier identifier — NEVER render in visible UI */
  id: string;
  name: string;
  website: string;
  notes: string;
}

export const SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'NorthGate Tech & Appliance Clearance Ltd',
    website: 'https://northgate-clearance.example.co.uk',
    notes:
      'Midlands distribution hub specialising in manufacturer-refurbished, graded, and ex-display consumer electronics and major domestic appliances.',
  },
  {
    id: 'SUP-002',
    name: 'Albion Home & Living Direct',
    website: 'https://albion-home-direct.example.co.uk',
    notes:
      'Yorkshire and Surrey showroom partner supplying ex-display, overstock, and end-of-line beds, pocket-sprung mattresses, sofas, and bedroom furniture.',
  },
  {
    id: 'SUP-003',
    name: 'Caledonian Surplus & Retail Partners',
    website: 'https://caledonian-surplus.example.co.uk',
    notes:
      'UK mainland distributor clearing factory-sealed retail overstock across small kitchen appliances, floorcare, and home accessories.',
  },
];

export function getSupplierById(supplierId: string): Supplier | undefined {
  return SUPPLIERS.find((s) => s.id === supplierId);
}
