import { describe, it, expect } from 'vitest';
import {
  filterVendors, regionsInData, primaryPhone, primaryWhatsapp, telLink, whatsappLink,
} from './suppliers';

const V = [
  { id: 'a', name: 'Accra Agro', categories: ['agrochemicals'], region: 'greater_accra',
    phones: ['+233302111111'], whatsapp: [], services: [], crops: [] },
  { id: 'b', name: 'Kumasi Chem', categories: ['agrochemicals', 'fertilizer'], region: 'ashanti',
    phones: ['+233244222222'], whatsapp: ['+233244222222'], services: [], crops: [] },
  { id: 'c', name: 'Trotro Tractor', categories: ['mechanization'], region: 'greater_accra',
    phones: ['+233501333333'], whatsapp: ['+233501333333'], services: ['Ploughing', 'Harrowing'], crops: [] },
];

describe('filterVendors', () => {
  it('filters by category', () => {
    expect(filterVendors(V, { category: 'fertilizer' }).map((v) => v.id)).toEqual(['b']);
  });

  it('filters by region', () => {
    expect(filterVendors(V, { region: 'ashanti' }).map((v) => v.id)).toEqual(['b']);
  });

  it("region 'all' returns everything", () => {
    expect(filterVendors(V, { region: 'all' })).toHaveLength(3);
  });

  it('keyword re-ranks but never excludes', () => {
    const out = filterVendors(V, { category: 'mechanization', keyword: 'Ploughing' });
    expect(out).toHaveLength(1); // still category-scoped
    expect(out[0].id).toBe('c'); // service match ranks first
  });

  it('keyword ranks a name/service match above non-matches', () => {
    const out = filterVendors(V, { keyword: 'tractor' });
    expect(out[0].id).toBe('c');
  });
});

describe('contact helpers', () => {
  it('primaryPhone / primaryWhatsapp pick the first entry or null', () => {
    expect(primaryPhone(V[0])).toBe('+233302111111');
    expect(primaryWhatsapp(V[0])).toBeNull(); // landline-only vendor
    expect(primaryWhatsapp(V[1])).toBe('+233244222222');
  });

  it('telLink strips formatting', () => {
    expect(telLink('+233 244 222 222')).toBe('tel:+233244222222');
  });

  it('whatsappLink builds a wa.me link with an encoded message', () => {
    const url = whatsappLink(V[1], { treatment: 'Mancozeb', category: 'agrochemicals', lang: 'en' });
    expect(url).toContain('https://wa.me/233244222222?text=');
    expect(decodeURIComponent(url)).toContain('Mancozeb');
  });

  it('whatsappLink uses a generic enquiry for service vendors', () => {
    const url = whatsappLink(V[2], { category: 'mechanization', lang: 'en' });
    expect(decodeURIComponent(url)).toContain('services');
  });
});

describe('regionsInData', () => {
  it('returns distinct non-null regions', () => {
    expect(regionsInData(V).sort()).toEqual(['ashanti', 'greater_accra']);
  });
});
