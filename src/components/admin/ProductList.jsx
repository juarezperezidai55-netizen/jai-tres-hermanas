import React, { useState } from 'react';
import { supabase } from '../../api/supabaseClient'; // Aseguramos la conexión para la cascada
import { Search, Edit, Trash2, AlertTriangle, Package, Calendar, DollarSign, Layers, Eye, CheckCircle } from 'lucide-react';
import './ProductList.css';

const ProductList = ({ productos, searchTerm, setSearchTerm, handleEditClick, handleDeleteProduct }) => {
  // --- NUEVO ESTADO DE FILTRADO RAPIDO ---
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'normal', 'out'
  const [deletingId, setDeletingId] = useState(null); // Feedback visual de carga al borrar

  // 1. Filtrado inteligente por texto y por estado de stock
  const filteredProducts = productos.filter(p => {
    const matchesSearch = 
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = p.stock > 0 && p.stock < 5;
    } else if (stockFilter === 'out') {
      matchesStock = p.stock === 0 || !p.stock;
    } else if (stockFilter === 'normal') {
      matchesStock = p.stock >= 5;
    }

    return matchesSearch && matchesStock;
  });

  // 2. Separar productos con Bajo Stock (menos de 5 unidades) - Mantiene tu lógica original
  const lowStockProducts = productos.filter(p => p.stock < 5);

  // --- NUEVAS METRICAS DE ADMINISTRACIÓN PROFESIONAL ---
  const totalCostoInventario = productos.reduce((acc, p) => acc + ((Number(p.costo) || 0) * (Number(p.stock) || 0)), 0);
  const totalValorVenta = productos.reduce((acc, p) => acc + ((Number(p.precio) || 0) * (Number(p.stock) || 0)), 0);

  // 3. Agrupar productos por Mes de registro - Mantiene tu lógica original intacta
  const groupByMonth = (items) => {
    return items.reduce((acc, p) => {
      const fecha = p.created_at ? new Date(p.created_at) : new Date();
      const mesAnio = fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      if (!acc[mesAnio]) acc[mesAnio] = [];
      acc[mesAnio].push(p);
      return acc;
    }, {});
  };

  const grouped = groupByMonth(filteredProducts);

  // --- 🛠️ INTERCEPTOR REFORZADO CONTRA EL BLOQUEO DE INTEGRIDAD (BORRADO EN CASCADA) ---
  const handleBorradoSeguroEnCascada = async (id, nombre) => {
    const confirmar = window.confirm(`¿Estás completamente seguro de eliminar "${nombre}"? Esta acción borrará permanentemente sus variantes y stocks en sucursales.`);
    if (!confirmar) return;

    try {
      setDeletingId(id);

      // Paso A: Eliminar dependencias en 'inventario_sucursal'
      await supabase
        .from('inventario_sucursal')
        .delete()
        .eq('producto_id', id);

      // Paso B: Eliminar dependencias en 'producto_variantes'
      await supabase
        .from('producto_variantes')
        .delete()
        .eq('producto_maestro_id', id);

      // Paso C: Ejecutar tu función original padre que limpia la tabla 'productos' y actualiza el estado
      await handleDeleteProduct(id, nombre);

    } catch (error) {
      console.error("Error en cascada:", error);
      alert("Hubo un detalle al limpiar las relaciones del producto. Inténtalo de nuevo.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="inventory-dashboard">
      
      {/* HEADER DE RESUMEN INTEGRANDO METRICAS PREMUM */}
      <div className="inventory-summary-grid">
        <div className="summary-card-pro catalog-border">
          <div className="summary-card-header-pro">
            <Package size={20} className="icon-blue" />
            <span>Total Catálogo</span>
          </div>
          <h2 className="summary-card-value">{productos.length} <small>ítems</small></h2>
        </div>

        <div className="summary-card-pro alert-border">
          <div className="summary-card-header-pro">
            <AlertTriangle size={20} className="icon-red" />
            <span>Bajo Stock</span>
          </div>
          <h2 className="summary-card-value text-red-value">{lowStockProducts.length} <small>por agotar</small></h2>
        </div>

        <div className="summary-card-pro finance-border">
          <div className="summary-card-header-pro">
            <DollarSign size={20} className="icon-pink" />
            <span>Inversión en Stock</span>
          </div>
          <h2 className="summary-card-value">${totalCostoInventario.toLocaleString('es-MX', {minimumFractionDigits: 2})}</h2>
        </div>

        <div className="summary-card-pro sale-border">
          <div className="summary-card-header-pro">
            <CheckCircle size={20} className="icon-green" />
            <span>Valor Estimado Venta</span>
          </div>
          <h2 className="summary-card-value text-green-value">${totalValorVenta.toLocaleString('es-MX', {minimumFractionDigits: 2})}</h2>
        </div>
      </div>

      {/* CUERPO PRINCIPAL EN DOS COLUMNAS */}
      <div className="inventory-content-layout">
        
        {/* COLUMNA IZQUIERDA: LISTADO AGRUPADO */}
        <div className="main-list-column">
          
          {/* BARRA DE FILTROS INTELIGENTES */}
          <div className="control-bar-wrapper">
            <div className="search-container-pro">
              <Search size={18} className="search-icon-pro" />
              <input 
                type="text" 
                placeholder="Buscar por nombre, accesorio o SKU..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            <div className="filter-badge-box">
              <select 
                value={stockFilter} 
                onChange={(e) => setStockFilter(e.target.value)}
                className="filter-dropdown-pro"
              >
                <option value="all">Filtro: Todos los niveles</option>
                <option value="normal">Stock Saludable (≥ 5 pzas)</option>
                <option value="low">Stock Crítico (1 - 4 pzas)</option>
                <option value="out">Agotados (0 pzas)</option>
              </select>
            </div>
          </div>

          {Object.keys(grouped).length === 0 ? (
            <div className="empty-state-card">
              🌸 No se encontraron accesorios con los filtros aplicados en este momento.
            </div>
          ) : (
            Object.keys(grouped).map(mes => (
              <div key={mes} className="month-group-container">
                <h3 className="month-group-title">
                  <Calendar size={16} className="icon-calendar-jai"/> {mes.toUpperCase()}
                </h3>
                
                <div className="products-list-stack">
                  {grouped[mes].map(p => {
                    const isLow = p.stock < 5;
                    const isOut = p.stock === 0 || !p.stock;

                    return (
                      <div key={p.id} className={`product-item-card-pro ${deletingId === p.id ? 'row-deleting' : ''}`}>
                        <div className="product-thumb-container">
                          <img src={p.imagen_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=150'} alt="" className="product-image-pro" />
                          {isOut && <span className="badge-out-floating">Agotado</span>}
                        </div>

                        <div className="product-main-details">
                          <span className="product-name-txt">{p.nombre}</span>
                          <span className="product-sku-txt">SKU: {p.sku || 'Sin Código'}</span>
                        </div>

                        <div className="product-financials-details">
                          <span className="product-price-txt">${p.precio} <small style={{fontSize: '11px', color: '#94a3b8'}}>púb.</small></span>
                          <span className="product-cost-txt">Costo: ${p.costo || 0}</span>
                        </div>

                        <div className="product-stock-status">
                          <span className={`stock-counter-badge ${isOut ? 'bg-danger-light' : isLow ? 'bg-warning-light' : 'bg-success-light'}`}>
                            {p.stock || 0} pzs
                          </span>
                        </div>

                        <div className="product-actions-cell">
                          <button 
                            className="btn-action-jai edit-btn" 
                            onClick={() => handleEditClick(p)} 
                            title="Editar parámetros"
                          >
                            <Edit size={15}/>
                          </button>
                          <button 
                            className="btn-action-jai delete-btn" 
                            onClick={() => handleBorradoSeguroEnCascada(p.id, p.nombre)}
                            disabled={deletingId === p.id}
                            title="Eliminar permanentemente"
                          >
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* COLUMNA DERECHA: PANAL REBASTECIMIENTO */}
        <div className="alerts-column-pro">
          <div className="reorder-sticky-card">
            <h4 className="reorder-card-title">
              <AlertTriangle size={18}/> Panel de Reorden
            </h4>
            <p style={{fontSize: '12px', color: '#64748b', margin: '-8px 0 12px 0'}}>Artículos que requieren atención logística inmediata.</p>
            
            <div className="reorder-items-stack">
              {lowStockProducts.length === 0 ? (
                <p className="clean-stock-msg">Todo el stock está al día de forma saludable. ✨</p>
              ) : (
                lowStockProducts.slice(0, 8).map(p => (
                  <div key={p.id} className="reorder-item-row">
                    <span className="reorder-name">{p.nombre}</span>
                    <span className={`reorder-qty-tag ${p.stock === 0 ? 'critico-red' : 'critico-amber'}`}>
                      {p.stock} pzs
                    </span>
                  </div>
                ))
              )}
              {lowStockProducts.length > 8 && (
                <div className="reorder-footer-note">
                  Y {lowStockProducts.length - 8} productos más en alerta...
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductList;