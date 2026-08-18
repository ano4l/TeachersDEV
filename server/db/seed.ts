import { getConfig } from '../config.js'
import { createPool } from './pool.js'
import { encrypt } from '../security.js'

const businesses = [
  ['island-spice', 'Island Spice', 'Dining', 'Independent Caribbean kitchen with educator-friendly dining.', 'https://images.unsplash.com/photo-1632852576480-c10a8e19496a?w=900&h=600&fit=crop', 'https://example.com', '0.2 mi', 'Open now · closes 9 PM', true, '1 Fox Street, Ferreirasdorp, Johannesburg', -26.20491, 28.03136],
  ['glow-beauty', 'Glow Beauty', 'Services', 'Full-service salon offering hair, color, and skincare.', 'https://images.unsplash.com/photo-1695527081848-1e46c06e6458?w=900&h=600&fit=crop', 'https://example.com', '0.6 mi', 'Open now · closes 7 PM', true, '17 4th Avenue, Parkhurst, Johannesburg', -26.13954, 28.02042],
  ['cafe-101', 'Cafe 101', 'Coffee', 'Neighborhood roaster serving espresso and iced drinks.', 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=900&h=600&fit=crop', 'https://example.com', '0.4 mi', 'Open now · closes 6 PM', true, '44 Stanley Avenue, Milpark, Johannesburg', -26.18555, 28.01819],
  ['booknook', 'BookNook', 'Retail', 'Independent bookshop with an educator reading corner.', 'https://images.unsplash.com/photo-1584801096196-592feb269e31?w=900&h=600&fit=crop', 'https://example.com', '1.1 mi', 'Open now · closes 8 PM', true, '19 7th Street, Melville, Johannesburg', -26.17518, 28.00917],
  ['teacher-tech', 'Teacher Tech Online', 'Online', 'Digital classroom tools and educator resources.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&h=600&fit=crop', 'https://example.com', null, null, null, null, null, null],
]

const deals = [
  ['island-spice-20', 'island-spice', '20% OFF Any Entrée', 'Save on any dine-in entrée.', 'in_person', 'Dining', 'Valid for verified educators. One offer per visit.', null, 500, true, false, false],
  ['glow-beauty-10', 'glow-beauty', '10% OFF All Services', 'Save on salon and spa services.', 'in_person', 'Services', 'Appointment required. Excludes retail products.', null, 1200, false, true, false],
  ['cafe-101-2', 'cafe-101', '$2 OFF Any Drink', 'Choose any handcrafted drink.', 'in_person', 'Coffee', 'One drink per educator per visit.', null, 200, true, false, false],
  ['booknook-15', 'booknook', '15% OFF Purchase', 'Save on books and educator gifts.', 'in_person', 'Retail', 'Excludes gift cards and special orders.', null, 750, false, false, false],
  ['teacher-tech-25', 'teacher-tech', '25% OFF Annual Plan', 'Access classroom resources online.', 'online', 'Online', 'New annual subscriptions only.', 'EDUCATOR25', 2500, true, false, false],
  ['teacher-tech-giveaway', 'teacher-tech', 'Classroom Toolkit Giveaway', 'Enter for a chance to receive a classroom technology toolkit.', 'online', 'Giveaways', 'One entry per verified educator.', null, 5000, false, false, true],
]

export async function seed() {
  const config = getConfig()
  const pool = createPool(config)
  try {
    for (const row of businesses) {
      await pool.query(`INSERT INTO businesses(id,name,category,description,image_url,website_url,distance,hours,is_open,address,latitude,longitude)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, image_url=EXCLUDED.image_url, address=EXCLUDED.address, latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude`, row)
    }
    for (const original of deals) {
      const row = [...original]
      if (typeof row[7] === 'string') row[7] = encrypt(row[7], config.DATA_ENCRYPTION_KEY)
      await pool.query(`INSERT INTO deals(id,business_id,title,description,channel,category,restrictions,promo_code_encrypted,estimated_savings_cents,featured,sponsored,giveaway)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, restrictions=EXCLUDED.restrictions`, row)
    }
  } finally { await pool.end() }
}

if (import.meta.url.endsWith(process.argv[1]?.replaceAll('\\', '/') ?? '')) {
  seed().then(() => console.log('Seed data ready.')).catch(error => { console.error(error); process.exit(1) })
}
