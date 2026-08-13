require('dotenv').config();
const { Sequelize } = require('sequelize');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('NO_DATABASE_URL');
  process.exit(1);
}

const s = new Sequelize(url, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});

const demos = [
  {
    title: 'Summer Cup Registrations Open',
    short_description:
      'Early bird entries for the 2026 Summer Cup are now live. Secure your team spot today before slots fill up!',
    description:
      'The SEC Cricket Club Summer Cup 2026 registration is officially open.\n\nEarly bird entries are available for the next two weeks. Please register your team at the clubhouse desk or through the membership office.\n\nSlots are limited. Priority will be given to active verified members.',
    announcement_type: 'Tournament',
    priority: 'High',
    is_pinned: true,
    status: 'Published',
    cover_image: '/uploads/announcements/demo-summer-cup.jpg',
  },
  {
    title: 'Annual Membership Renewals',
    short_description:
      'Please renew your club membership before the upcoming league fixtures begin next month.',
    description:
      'Annual membership renewals for the new season are now open.\n\nForms and payment details are available at the clubhouse reception. Members who renew before the deadline will retain full directory and lounge access.\n\nContact the secretary office if you need assistance with payment plans.',
    announcement_type: 'Club Update',
    priority: 'Medium',
    is_pinned: false,
    status: 'Published',
    cover_image: '/uploads/announcements/demo-membership.jpg',
  },
  {
    title: 'Training Cancelled Due to Weather',
    short_description:
      'Afternoon training is cancelled today due to heavy rain and pitch waterlogging.',
    description:
      'Due to heavy monsoon showers and waterlogging on the main pitch, training scheduled for this afternoon has been cancelled.\n\nIndoor net sessions will be announced separately once slots are confirmed. Please check NEWS for updates.',
    announcement_type: 'Emergency',
    priority: 'Urgent',
    is_pinned: true,
    status: 'Published',
    cover_image: '/uploads/announcements/demo-weather.jpg',
  },
  {
    title: 'AGM Meeting — August Board Session',
    short_description:
      'Annual General Meeting will be held at the main clubhouse lounge. Attendance is requested for all primary members.',
    description:
      'Our Annual General Meeting (AGM) will take place at the main clubhouse lounge.\n\nAgenda includes season review, sponsorship updates, and upcoming tournament calendar.\n\nPlease arrive 15 minutes early. Light refreshments will be served after the session.',
    announcement_type: 'Meeting',
    priority: 'High',
    is_pinned: false,
    status: 'Published',
    cover_image: '/uploads/announcements/demo-agm.jpg',
  },
  {
    title: 'Independence Day Club Holiday',
    short_description:
      'Club grounds and lounge will remain closed on Independence Day. Regular schedule resumes the next morning.',
    description:
      'SEC Cricket Club will observe Independence Day as a holiday.\n\nGrounds, nets, and the corporate lounge will remain closed for the day. Regular practice and lounge timings resume the following morning.\n\nHave a safe and happy holiday!',
    announcement_type: 'Holiday',
    priority: 'Low',
    is_pinned: false,
    status: 'Published',
    cover_image: '/uploads/announcements/demo-holiday.jpg',
  },
  {
    title: 'New Business Networking Evening',
    short_description:
      'Join fellow members for a business networking evening focused on partnerships and referrals.',
    description:
      'A special Business Networking Evening has been scheduled for SEC members.\n\nBring your visiting card and business flyers. The session will include short introductions, open networking, and partnership discussions.\n\nRSVP at the reception desk to confirm your seat.',
    announcement_type: 'Business Update',
    priority: 'Medium',
    is_pinned: false,
    status: 'Published',
    cover_image: '/uploads/announcements/demo-networking.jpg',
  },
];

(async () => {
  await s.authenticate();

  // Ensure table exists (in case sync hasn't run yet)
  await s.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      short_description VARCHAR(500) NOT NULL,
      description TEXT NOT NULL,
      cover_image VARCHAR(255),
      attachments JSONB DEFAULT '[]',
      announcement_type VARCHAR(50) NOT NULL DEFAULT 'General',
      priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
      is_pinned BOOLEAN NOT NULL DEFAULT false,
      status VARCHAR(20) NOT NULL DEFAULT 'Draft',
      publish_date TIMESTAMPTZ,
      expiry_date TIMESTAMPTZ,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  let inserted = 0;
  let updated = 0;
  for (const item of demos) {
    const [existing] = await s.query(
      `SELECT id, cover_image FROM announcements WHERE title = :title LIMIT 1`,
      { replacements: { title: item.title } },
    );

    if (existing.length > 0) {
      await s.query(
        `
        UPDATE announcements
        SET cover_image = :cover_image,
            updated_at = NOW()
        WHERE title = :title
        `,
        {
          replacements: {
            title: item.title,
            cover_image: item.cover_image,
          },
        },
      );
      updated += 1;
      console.log(`UPDATED cover: ${item.title}`);
      continue;
    }

    await s.query(
      `
      INSERT INTO announcements (
        title, short_description, description, cover_image, attachments,
        announcement_type, priority, is_pinned, status,
        publish_date, expiry_date, created_by, updated_by, created_at, updated_at
      ) VALUES (
        :title, :short_description, :description, :cover_image, '[]'::jsonb,
        :announcement_type, :priority, :is_pinned, :status,
        NOW() - (:offsetHours * INTERVAL '1 hour'),
        NOW() + INTERVAL '90 days',
        1, 1, NOW() - (:offsetHours * INTERVAL '1 hour'), NOW()
      )
      `,
      {
        replacements: {
          ...item,
          offsetHours: inserted * 6 + 1,
        },
      },
    );
    inserted += 1;
    console.log(`INSERTED: ${item.title}`);
  }

  const [rows] = await s.query(
    `SELECT id, title, cover_image, announcement_type, priority, is_pinned, status
     FROM announcements
     WHERE status = 'Published'
     ORDER BY is_pinned DESC, publish_date DESC`,
  );

  console.log('\nPublished announcements now in DB:');
  console.log(JSON.stringify(rows, null, 2));
  console.log(`\nDone. Inserted ${inserted}, updated covers ${updated}.`);
  await s.close();
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
