import React, { useState } from 'react';
import { 
  Home, ShoppingBag, MessageSquare, Package, Ticket, Users, 
  BarChart2, ChevronDown, ChevronRight, UserCircle, LogOut,
  BarChart3, UserPlus, Image as ImageIcon, Clock 
} from 'lucide-react';

// VENTANAS 
import ProductsView from './ProductsView';
import OrdersTable from './OrdersTable'; 
import PaymentsMonitor from './PaymentsMonitor';
import FinanceView from './FinanceView';
import CouponsView from './CouponsView'; 
import CustomersView from './CustomersView';
import SupportView from './SupportView'; 
import ReportView from './ReportView'; 
import BannerAdmin from './BannerAdmin'; 
import StaffView from './StaffView'; 
import AsistenciasView from './AsistenciasView'; // Integrado correctamente aquí
import './AdminDashboard.css';

const AdminDashboard = ({ onBack, userRole }) => {
  const [activeMenu, setActiveMenu] = useState('inicio');
  const [openSubmenu, setOpenSubmenu] = useState('productos_menu');

  // Configuración de visualización limpia en base a tus 3 puestos oficiales
  const menuConfig = [
    { id: 'inicio', label: 'Inicio', icon: <Home size={18} />, roles: ['vendedor', 'gerente', 'administrador'] },
    { 
      id: 'ventas', label: 'Ventas', icon: <ShoppingBag size={18} />, 
      roles: ['vendedor', 'gerente', 'administrador'],
      subItems: [{ id: 'ordenes', label: 'Órdenes' }, { id: 'pagos', label: 'Pagos' }]
    },
    { id: 'atencion', label: 'At. Cliente', icon: <MessageSquare size={18} />, roles: ['vendedor', 'gerente', 'administrador'] },
    { 
      id: 'productos_menu', label: 'Productos', icon: <Package size={18} />, 
      roles: ['vendedor', 'gerente', 'administrador'],
      subItems: [
        { id: 'listar_prod', label: 'Listar Productos' },
        { id: 'agregar_prod', label: 'Agregar Nuevo', exclusivoRoles: ['gerente', 'administrador'] }, // Restringido para Vendedores
        { id: 'sucursales', label: 'Stock Sucursales' }
      ]
    },
    { id: 'cupones', label: 'Cupones', icon: <Ticket size={18} />, roles: ['gerente', 'administrador'] },
    { id: 'clientes', label: 'Clientes', icon: <Users size={18} />, roles: ['vendedor', 'gerente', 'administrador'] },
    { id: 'finanzas', label: 'Finanzas JAI', icon: <BarChart3 size={18} />, roles: ['administrador'] },
    { id: 'reportes', label: 'Reportes', icon: <BarChart2 size={18} />, roles: ['vendedor', 'gerente', 'administrador'] },
    { id: 'banners_admin', label: 'Banners', icon: <ImageIcon size={18} />, roles: ['administrador'] },
    { id: 'personal_control', label: 'Gestión Personal', icon: <UserPlus size={18} />, roles: ['administrador'] },
    { id: 'asistencias', label: 'Reloj Checador', icon: <Clock size={18} />, roles: ['vendedor', 'gerente', 'administrador'] }, // Integrado correctamente aquí
  ];

  // 1. Filtrar los módulos primarios del sidebar
  const filteredMenuConfig = menuConfig.filter(item => item.roles.includes(userRole));

  // 2. Filtrar sub-ítems reactivos en base al puesto activo
  const getFilteredSubItems = (item) => {
    if (!item.subItems) return null;
    return item.subItems.filter(sub => !sub.exclusivoRoles || sub.exclusivoRoles.includes(userRole));
  };

  return (
    <div className="admin-wrapper">
      <header className="admin-topbar">
        <div className="admin-brand">JAI <span>TRES HERMANAS</span></div>
        <div className="topbar-right">
          <div className="user-info">
            <UserCircle size={24} />
            <div className="user-text">
              <span className="user-name">Personal JAI</span>
              <span className="user-role" style={{ textTransform: 'uppercase', color: '#dcb45d', fontWeight: 'bold' }}>{userRole}</span>
            </div>
          </div>
          <button className="top-logout" onClick={onBack} title="Cerrar Sesión Segura"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="admin-main-container">
        <aside className="admin-sidebar-nav">
          <nav className="sidebar-menu">
            {filteredMenuConfig.map((item) => {
              const subItemsValidos = getFilteredSubItems(item);
              return (
                <div key={item.id} className="menu-group">
                  <div className={`menu-item ${activeMenu === item.id ? 'active' : ''}`} onClick={() => subItemsValidos ? setOpenSubmenu(openSubmenu === item.id ? null : item.id) : setActiveMenu(item.id)}>
                    <div className="menu-link-content">{item.icon}<span>{item.label}</span></div>
                    {subItemsValidos && (openSubmenu === item.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                  </div>
                  {subItemsValidos && openSubmenu === item.id && (
                    <div className="submenu-list">
                      {subItemsValidos.map(sub => (
                        <div key={sub.id} className={`submenu-item ${activeMenu === sub.id ? 'active' : ''}`} onClick={() => setActiveMenu(sub.id)}>
                          <div className="dot" /> {sub.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="admin-viewport">
          <div className="viewport-header">
            <h3>{activeMenu.replace('_', ' ').toUpperCase()}</h3>
            <div className="breadcrumbs">Panel / {activeMenu}</div>
          </div>

          <div className="viewport-card">
            {activeMenu === 'inicio' && (
              <div style={{textAlign: 'center', padding: '40px'}}>
                <h2 style={{color: '#cf69d4'}}>🌸 ¡Bienvenida a JAI!</h2>
                <p>Gestiona tu inventario y ventas desde aquí.</p>
              </div>
            )}

            {(activeMenu === 'listar_prod' || activeMenu === 'agregar_prod' || activeMenu === 'sucursales') && (
              <ProductsView activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
            )}

            {activeMenu === 'ordenes' && <OrdersTable />}
            {activeMenu === 'pagos' && <PaymentsMonitor />}
            {activeMenu === 'cupones' && <CouponsView />}
            {activeMenu === 'clientes' && <CustomersView />}
            {activeMenu === 'atencion' && <SupportView />}
            {activeMenu === 'finanzas' && <FinanceView />}
            {activeMenu === 'reportes' && <ReportView />}
            {activeMenu === 'banners_admin' && <BannerAdmin />}
            {activeMenu === 'personal_control' && <StaffView />}
            {activeMenu === 'asistencias' && <AsistenciasView userRole={userRole} />} {/* Integrado correctamente aquí */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;