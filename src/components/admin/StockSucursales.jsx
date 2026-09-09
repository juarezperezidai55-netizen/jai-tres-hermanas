import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { MapPin, Box, Layers, ArrowUpRight, PlusCircle, Search, Filter, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import './StockSucursales.css';

const StockSucursales = ({ invData, setInvData, productos, sucursales, handleUpdateStock }) => {
  const [variantes, setVariantes] = useState([]);
  const [loadingVariantes, setLoadingVariantes] = useState(false);

  // --- NUEVOS ESTADOS PARA MAPEAR TU TABLA 'inventario_sucursal' Y BUSCAR ---
  const [dbInventario, setDbInventario] = useState([]);
  const [loadingInventario, setLoadingInventario] = useState(false);
  
  // Buscador para el Formulario de Asignación (Evita el caos de una sola letra en el select)
  const [searchFormProducto, setSearchFormProducto] = useState('');

  // Buscadores y filtros para la Matriz Global de abajo
  const [searchTerm, setSearchTerm] = useState('');
  const [sucursalFilter, setSucursalFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');

  // EFECTO 1: Traer los datos reales de las piezas en cada sucursal desde tu tabla física
  const fetchInventarioReal = async () => {
    setLoadingInventario(true);
    const { data, error } = await supabase
      .from('inventario_sucursal')
      .select('id, sucursal_id, producto_id, cantidad');
    
    if (!error && data) {
      setDbInventario(data);
    }
    setLoadingInventario(false);
  };

  useEffect(() => {
    fetchInventarioReal();
  }, [productos, sucursales]);

  // Hacemos que se refresque la tabla automáticamente si le das clic al botón de actualizar
  const ejecutarActualizacionYRefrescar = async () => {
    await handleUpdateStock();
    // Le damos un pequeño retraso para asegurar que Supabase guarde y volvemos a consultar
    setTimeout(() => {
      fetchInventarioReal();
    }, 600);
  };

  // EFECTO 2: Cada vez que cambie el producto seleccionado, buscamos si tiene variantes
  useEffect(() => {
    const fetchVariantes = async () => {
      if (!invData.producto_id) {
        setVariantes([]);
        return;
      }
      setLoadingVariantes(true);
      const { data } = await supabase
        .from('producto_variantes')
        .select('*')
        .eq('producto_maestro_id', invData.producto_id);
      
      setVariantes(data || []);
      setLoadingVariantes(false);
    };
    fetchVariantes();
  }, [invData.producto_id]);

  // --- FILTRADO INTELIGENTE 1: Productos disponibles en el Formulario Principal ---
  const productosFiltradosParaFormulario = productos.filter(p => 
    p.nombre?.toLowerCase().includes(searchFormProducto.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchFormProducto.toLowerCase())
  );

  // --- FILTRADO INTELIGENTE 2: Productos que se listan en la Matriz Global de Abajo ---
  const productosFiltradosMatriz = productos.filter(p => {
    // 1. Buscador global por Nombre o SKU
    const matchesSearch = 
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    // Obtenemos los registros de stock de este producto específico desde la base de datos
    const stocksDelProducto = dbInventario.filter(inv => Number(inv.producto_id) === Number(p.id));
    
    // 2. Filtro por Sucursal específica activa
    let matchesSucursal = true;
    if (sucursalFilter !== 'all') {
      matchesSucursal = stocksDelProducto.some(inv => Number(inv.sucursal_id) === Number(sucursalFilter) && inv.cantidad > 0);
    }

    // Calcular la sumatoria de todas las piezas del producto en la red comercial
    const totalGeneralStock = stocksDelProducto.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);

    // 3. Filtro por Estado de Stock
    let matchesStatus = true;
    if (stockStatusFilter === 'disponible') {
      matchesStatus = totalGeneralStock > 3;
    } else if (stockStatusFilter === 'critico') {
      matchesStatus = totalGeneralStock > 0 && totalGeneralStock <= 3;
    } else if (stockStatusFilter === 'agotado') {
      matchesStatus = totalGeneralStock === 0;
    }

    return matchesSearch && matchesSucursal && matchesStatus;
  });

  return (
    <div className="stock-manager-container">
      {/* CARD 1: FORMULARIO DE ASIGNACIÓN */}
      <div className="stock-card">
        <div className="stock-card-header">
          <h3 className="stock-card-title">
            <PlusCircle size={22} color="#db2777"/> Gestión de Inventario Local
          </h3>
          <p className="stock-card-subtitle">Asigna existencias de productos y variantes por sucursal.</p>
        </div>

        <div className="stock-form-grid">
          {/* SELECCIÓN DE SUCURSAL */}
          <div className="form-group-jai">
            <label className="form-label-jai">
              <MapPin size={16}/> Ciudad / Sucursal
            </label>
            <select 
              value={invData.sucursal_id} 
              onChange={e => setInvData({...invData, sucursal_id: e.target.value})}
              className="form-select-jai"
            >
              <option value="">Seleccionar ciudad...</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          {/* SELECCIÓN DE PRODUCTO CON BARRA DE BÚSQUEDA INTELIGENTE INCORPORADA */}
          <div className="form-group-jai">
            <label className="form-label-jai">
              <Box size={16}/> Producto Maestro
            </label>
            {/* Input Buscador para filtrar interactivamente las opciones del select */}
            <div style={{ position: 'relative', marginBottom: '6px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text"
                placeholder="Escribe para buscar producto..."
                value={searchFormProducto}
                onChange={e => setSearchFormProducto(e.target.value)}
                style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            
            <select 
              value={invData.producto_id} 
              onChange={e => setInvData({...invData, producto_id: e.target.value, variante_id: ''})}
              className="form-select-jai"
              size={productosFiltradosParaFormulario.length > 1 && searchFormProducto ? 5 : 1} // Si está buscando se expande como lista elegante
            >
              <option value="">Seleccionar producto...</option>
              {productosFiltradosParaFormulario.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.sku ? `[${p.sku}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* SELECCIÓN DE VARIANTE (Aparece dinámicamente si aplica) */}
          {variantes.length > 0 && (
            <div className="form-group-jai variant-animated">
              <label className="form-label-jai variant-label">
                <Layers size={16}/> Especificar Variante
              </label>
              <select 
                value={invData.variante_id || ''} 
                onChange={e => setInvData({...invData, variante_id: e.target.value})}
                className="form-select-jai variant-select"
              >
                <option value="">Seleccionar color/modelo...</option>
                {variantes.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre_variante} (${v.precio})</option>
                ))}
              </select>
            </div>
          )}

          {/* CANTIDAD A INGRESAR */}
          <div className="form-group-jai">
            <label className="form-label-jai">
              <ArrowUpRight size={16}/> Cantidad a Ingresar
            </label>
            <input 
              type="number" 
              placeholder="0"
              value={invData.cantidad} 
              onChange={e => setInvData({...invData, cantidad: e.target.value})}
              className="form-input-jai"
            />
          </div>
        </div>

        <div className="stock-form-actions">
          <button 
            className="btn-update-stock"
            onClick={ejecutarActualizacionYRefrescar} 
            disabled={!invData.producto_id || !invData.sucursal_id || (variantes.length > 0 && !invData.variante_id)}
          >
            Actualizar Stock Sucursal
          </button>
        </div>
      </div>

      {/* CARD 2: MATRIZ GLOBAL DE EXISTENCIAS (CONEXIÓN CON TU TABLA INVENTARIO_SUCURSAL) */}
      <div className="stock-card table-card-margin">
        <div className="stock-card-header">
          <h3 className="stock-card-title">
            <Layers size={22} color="#db2777"/> Matriz Global de Existencias
          </h3>
          <p className="stock-card-subtitle">Consulta de forma inmediata cuántas piezas reales tienes distribuidas en la red comercial.</p>
        </div>

        {/* BARRA DE FILTROS DE CONSULTA RAPIDA */}
        <div className="stock-filters-wrapper">
          <div className="search-box-jai">
            <Search size={18} className="search-icon-jai" />
            <input 
              type="text" 
              placeholder="Buscar por nombre de accesorio o SKU en la matriz..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-selectors-grid">
            <div className="filter-select-container">
              <MapPin size={16} className="selector-icon-jai" />
              <select value={sucursalFilter} onChange={e => setSucursalFilter(e.target.value)}>
                <option value="all">Todas las Sucursales</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>

            <div className="filter-select-container">
              <Filter size={16} className="selector-icon-jai" />
              <select value={stockStatusFilter} onChange={e => setStockStatusFilter(e.target.value)}>
                <option value="all">Todos los Estados</option>
                <option value="disponible">Stock Saludable ({'>'} 3 pzas)</option>
                <option value="critico">Stock Crítico (1 - 3 pzas)</option>
                <option value="agotado">Agotados (0 pzas)</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLA ADAPTATIVA CON SEMÁFOROS CONECTADOS A TU BASE DE DATOS */}
        <div className="stock-table-responsive">
          <table className="stock-data-table">
            <thead>
              <tr>
                <th>Producto / SKU</th>
                {sucursales.map(s => (
                  <th key={s.id} className="text-center">{s.nombre}</th>
                ))}
                <th className="text-center">Total Red</th>
              </tr>
            </thead>
            <tbody>
              {loadingInventario ? (
                <tr>
                  <td colSpan={sucursales.length + 2} className="stock-table-empty">
                    🔄 Cargando existencias reales de Supabase...
                  </td>
                </tr>
              ) : productosFiltradosMatriz.length === 0 ? (
                <tr>
                  <td colSpan={sucursales.length + 2} className="stock-table-empty">
                    🌸 No se encontraron artículos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                productosFiltradosMatriz.map(p => {
                  // Filtramos las existencias de este producto en específico
                  const registrosDeEsteProducto = dbInventario.filter(inv => Number(inv.producto_id) === Number(p.id));
                  const totalGeneral = registrosDeEsteProducto.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);

                  return (
                    <tr key={p.id} className="stock-row-hover">
                      <td>
                        <div className="stock-product-info">
                          {p.imagen_url && (
                            <img src={p.imagen_url} alt={p.nombre} className="stock-product-thumb" />
                          )}
                          <div>
                            <span className="stock-product-name">{p.nombre}</span>
                            <span className="stock-product-sku">{p.sku || 'Sin SKU'}</span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Columnas dinámicas conectadas por ID a inventario_sucursal */}
                      {sucursales.map(s => {
                        const registroStock = registrosDeEsteProducto.find(inv => Number(inv.sucursal_id) === Number(s.id));
                        const cantidad = registroStock ? registroStock.cantidad : 0;
                        
                        // Sistema visual de semáforo por celda
                        let badgeClass = "badge-success-jai";
                        let Icon = CheckCircle;
                        if (cantidad === 0) {
                          badgeClass = "badge-danger-jai";
                          Icon = XCircle;
                        } else if (cantidad <= 3) {
                          badgeClass = "badge-warning-jai";
                          Icon = AlertTriangle;
                        }

                        return (
                          <td key={s.id} className="text-center">
                            <span className={`stock-status-badge ${badgeClass}`}>
                              <Icon size={12} /> {cantidad} pzas
                            </span>
                          </td>
                        );
                      })}

                      {/* Sumatoria total exacta de la red */}
                      <td className="text-center font-bold">
                        <span className="stock-total-indicator">
                          {totalGeneral} u.
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockSucursales;