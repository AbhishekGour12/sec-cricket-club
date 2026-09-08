import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../config/database';
import { Event } from '../admin/models/Event';
import { Sponsor } from '../admin/models/Sponsor';
import { EventSponsor } from '../admin/models/EventSponsor';

Event.hasMany(EventSponsor, { foreignKey: 'event_id', as: 'event_sponsors' });
EventSponsor.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
Sponsor.hasMany(EventSponsor, { foreignKey: 'sponsor_id', as: 'event_sponsors' });
EventSponsor.belongsTo(Sponsor, { foreignKey: 'sponsor_id', as: 'sponsor' });

async function main() {
  await connectDatabase();
  console.log('Connected to database.');

  const events = await Event.findAll({
    include: [
      {
        model: EventSponsor,
        as: 'event_sponsors',
        include: [{ model: Sponsor, as: 'sponsor' }],
      },
    ],
  });

  console.log(`Found ${events.length} events in database:`);
  for (const e of events) {
    console.log(
      `- ID: ${e.id} | Name: "${e.event_name}" | Date: ${e.event_date} | Status: ${e.status} | Sponsors: ${
        (e as any).event_sponsors?.length || 0
      }`
    );
  }

  const allSponsors = await Sponsor.findAll();
  console.log(`\nFound ${allSponsors.length} sponsors in database:`);
  for (const s of allSponsors) {
    console.log(`- ID: ${s.id} | Name: "${s.name}" | Logo: ${s.logo} | Website: ${s.website}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
