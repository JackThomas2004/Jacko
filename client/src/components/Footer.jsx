import { Link } from 'react-router-dom';

const COLUMNS = [
  {
    heading: 'About',
    links: [
      { label: 'How ParkSpot Works', to: '/' },
      { label: 'Newsroom', to: '/' },
      { label: 'Investors', to: '/' },
      { label: 'Careers', to: '/' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', to: '/' },
      { label: 'Contact Us', to: '/' },
      { label: 'Trust & Safety', to: '/' },
      { label: 'Report a Concern', to: '/' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/' },
      { label: 'Terms of Service', to: '/' },
      { label: 'Cookie Policy', to: '/' },
      { label: 'Sitemap', to: '/' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#F7F7F7] border-t border-[#DDDDDD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-[#222222] mb-4 uppercase tracking-wide">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-[#717171] hover:text-[#222222] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#DDDDDD] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-[#717171]">
            &copy; {new Date().getFullYear()} ParkSpot, Inc. All rights reserved.
          </p>
          <p className="text-sm text-[#717171]">
            Made with care for parking that works.
          </p>
        </div>
      </div>
    </footer>
  );
}
