import { useRouter } from "next/router";

export default function Sidebar() {
  const router = useRouter();

  const menuItems = [
    {
      name: "Dashboard",
      icon: "📊",
      path: "/hosdashboard",
    },
    {
      name: "Stock",
      icon: "📦",
      path: "/stock",
    },
    {
      name: "Transactions",
      icon: "🔄",
      path: "/transactions",
    },
    {
      name: "Products",
      icon: "💊",
      path: "/products",
    },
    {
      name: "Warehouses",
      icon: "🏢",
      path: "/warehouses",
    },
    {
      name: "Robot Tasks",
      icon: "🤖",
      path: "/robot",
    },
  ];

  const isActive = (path) => {
    return router.pathname === path;
  };

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="logo-area">
        <div className="logo-box">M</div>

        <div>
          <div className="logo-title">MedStock</div>
          <div className="logo-subtitle">
            Healthcare Inventory
          </div>
        </div>
      </div>

      {/* MENU */}
      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`menu-item ${
              isActive(item.path) ? "active" : ""
            }`}
            onClick={() => router.push(item.path)}
          >
            <span className="menu-icon">
              {item.icon}
            </span>

            {item.name}
          </button>
        ))}
      </nav>

      {/* BOTTOM */}
      <div className="sidebar-bottom">
        <button
          className={`menu-item ${
            isActive("/profile") ? "active" : ""
          }`}
          onClick={() => router.push("/profile")}
        >
          <span className="menu-icon">👤</span>
          Profile & Settings
        </button>

        <div className="user-box">
          <div className="user-avatar">
            JD
          </div>

          <div className="user-info">
            <strong>John Doe</strong>
            <span>Staff</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 315px;
          min-height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          background: #ffffff;
          border-right: 1px solid #e5eaf0;
          padding: 35px 20px 18px;
          display: flex;
          flex-direction: column;
          z-index: 100;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 0 5px;
          margin-bottom: 35px;
        }

        .logo-box {
          width: 50px;
          height: 50px;
          border-radius: 13px;
          background: #1769e0;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .logo-title {
          font-size: 24px;
          font-weight: 800;
          color: #172033;
        }

        .logo-subtitle {
          color: #91a0b4;
          font-size: 12px;
          margin-top: 3px;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .menu-item {
          width: 100%;
          min-height: 56px;
          border: none;
          background: transparent;
          color: #52627a;
          padding: 0 18px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          cursor: pointer;
          font-size: 17px;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .menu-item:hover {
          background: #f0f5fd;
          color: #1769e0;
        }

        .menu-item.active {
          background: #eaf2ff;
          color: #1769e0;
          font-weight: 700;
        }

        .menu-icon {
          width: 25px;
          min-width: 25px;
          text-align: center;
          font-size: 19px;
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .sidebar-bottom > .menu-item {
          margin-bottom: 20px;
        }

        .user-box {
          border-top: 1px solid #e5eaf0;
          padding: 20px 6px 0;
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .user-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: #e3efff;
          color: #1769e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .user-info strong {
          display: block;
          font-size: 14px;
          color: #172033;
        }

        .user-info span {
          display: block;
          color: #91a0b4;
          font-size: 12px;
          margin-top: 3px;
        }

        @media (max-width: 750px) {
          .sidebar {
            width: 75px;
            padding: 20px 8px;
          }

          .logo-area {
            justify-content: center;
            padding: 0;
          }

          .logo-area > div:last-child {
            display: none;
          }

          .menu-item {
            justify-content: center;
            padding: 0;
            font-size: 0;
          }

          .menu-icon {
            font-size: 19px;
          }

          .user-box {
            justify-content: center;
          }

          .user-info {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}