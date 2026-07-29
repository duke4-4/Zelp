import type { BusinessDetail, BusinessListFilters, BusinessListItem, BusinessListResult, CategoryLite } from '~/composables/useBusinesses'

// Temporary showroom data. Delete this file and the three `demo*` fallbacks
// in useBusinesses.ts once the production catalogue has been populated.
export const demoCategories: CategoryLite[] = [
  { id: 'demo-food', name: 'Restaurants', slug: 'restaurants', icon: 'i-lucide-utensils' },
  { id: 'demo-beauty', name: 'Beauty', slug: 'beauty', icon: 'i-lucide-sparkles' },
  { id: 'demo-home', name: 'Home services', slug: 'home-services', icon: 'i-lucide-wrench' },
  { id: 'demo-stay', name: 'Stays', slug: 'stays', icon: 'i-lucide-bed-double' },
  { id: 'demo-shop', name: 'Shopping', slug: 'shopping', icon: 'i-lucide-shopping-bag' },
  { id: 'demo-auto', name: 'Automotive', slug: 'automotive', icon: 'i-lucide-car' },
]

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=960&q=85`

export const demoBusinesses: BusinessListItem[] = [
  { id: 'demo-mukuvisi', name: 'Mukuvisi Kitchen', slug: 'mukuvisi-kitchen', description: 'Seasonal Zimbabwean plates in a bright, relaxed dining room.', city: 'Harare', province: 'Harare', avgRating: 4.8, reviewCount: 124, createdAt: '2026-07-24T10:00:00Z', categories: [demoCategories[0]!], coverImageUrl: photo('photo-1515003197210-e0cd71810b5f') },
  { id: 'demo-olive', name: 'Olive & Thread', slug: 'olive-and-thread', description: 'Thoughtful cuts, colour and protective styling.', city: 'Bulawayo', province: 'Bulawayo', avgRating: 4.7, reviewCount: 89, createdAt: '2026-07-22T10:00:00Z', categories: [demoCategories[1]!], coverImageUrl: photo('photo-1522337360788-8b13dee7a37e') },
  { id: 'demo-fix', name: 'Fix It Harare', slug: 'fix-it-harare', description: 'Reliable electrical and plumbing help for your home.', city: 'Harare', province: 'Harare', avgRating: 4.6, reviewCount: 57, createdAt: '2026-07-20T10:00:00Z', categories: [demoCategories[2]!], coverImageUrl: photo('photo-1504148455328-c376907d081c') },
  { id: 'demo-kopje', name: 'The Kopje House', slug: 'the-kopje-house', description: 'A calm city stay with considered local touches.', city: 'Masvingo', province: 'Masvingo', avgRating: 4.9, reviewCount: 41, createdAt: '2026-07-18T10:00:00Z', categories: [demoCategories[3]!], coverImageUrl: photo('photo-1566073771259-6a8506099945') },
  { id: 'demo-mbare', name: 'Mbare Makers Market', slug: 'mbare-makers-market', description: 'Craft, textiles and everyday finds from local makers.', city: 'Harare', province: 'Harare', avgRating: 4.5, reviewCount: 36, createdAt: '2026-07-16T10:00:00Z', categories: [demoCategories[4]!], coverImageUrl: photo('photo-1441986300917-64674bd600d8') },
  { id: 'demo-road', name: 'Road Ready Auto', slug: 'road-ready-auto', description: 'Straightforward servicing and diagnostics.', city: 'Mutare', province: 'Manicaland', avgRating: 4.4, reviewCount: 28, createdAt: '2026-07-14T10:00:00Z', categories: [demoCategories[5]!], coverImageUrl: photo('photo-1487754180451-c456f719a1fc') },
]

export function getDemoBusinessList(filters: BusinessListFilters): BusinessListResult {
  const term = filters.q?.toLowerCase().trim()
  let items = demoBusinesses.filter((business) => {
    const searchable = `${business.name} ${business.description} ${business.city} ${business.province}`.toLowerCase()
    return (!term || searchable.includes(term))
      && (!filters.category || business.categories.some(category => category.slug === filters.category))
      && (!filters.city || business.city?.toLowerCase().includes(filters.city.toLowerCase()))
      && (!filters.province || business.province?.toLowerCase().includes(filters.province.toLowerCase()))
      && (filters.minRating === undefined || business.avgRating >= filters.minRating)
  })
  items = items.slice().sort((a, b) => filters.sort === 'rating'
    ? b.avgRating - a.avgRating
    : b.createdAt.localeCompare(a.createdAt))
  const pageSize = filters.pageSize ?? 12
  const page = filters.page ?? 1
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize }
}

export function getDemoBusiness(slug: string): BusinessDetail | null {
  const business = demoBusinesses.find(item => item.slug === slug)
  if (!business) return null
  return {
    ...business,
    phone: '+263 77 123 4567', whatsapp: '+263 77 123 4567', email: 'hello@zelp-demo.test', website: 'https://example.com',
    address: '12 Samora Machel Avenue', hours: { monday: { open: '08:00', close: '18:00' }, tuesday: { open: '08:00', close: '18:00' }, wednesday: { open: '08:00', close: '18:00' }, thursday: { open: '08:00', close: '18:00' }, friday: { open: '08:00', close: '18:00' }, saturday: { open: '09:00', close: '15:00' } }, socials: null, viewCount: 0,
    images: business.coverImageUrl ? [{ id: `${business.id}-image`, url: business.coverImageUrl, kind: 'cover', position: 0 }] : [], owner: null,
  }
}
