import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiUsers, FiAward, FiFileText, FiDollarSign, FiBell, FiSettings, FiLogOut } from 'react-icons/fi';

const AdminSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { href: '/admin/competitions', icon: <FiAward />, label: 'Lomba' },
    { href: '/admin/participants', icon: <FiUsers />, label: 'Peserta' },
    { href: '/admin/proposals', icon: <FiFileText />, label: 'Proposal' },
    { href: '/admin/finance', icon: <FiDollarSign />, label: 'Keuangan' },
    { href: '/admin/notifications', icon: <FiBell />, label: 'Notifikasi' },
    { href: '/admin/settings', icon: <FiSettings />, label: 'Pengaturan' },
  ];

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">17 Agustus Dashboard</h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center p-2 rounded-lg hover:bg-gray-100 ${
                  pathname === item.href ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/api/auth"
              className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <span className="mr-3"><FiLogOut /></span>
              <span>Keluar</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;