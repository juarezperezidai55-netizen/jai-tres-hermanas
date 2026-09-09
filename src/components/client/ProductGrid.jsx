import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useCart } from '../../context/CartContext'; 
import ProductCard from './ProductCard';
import { Filter, Truck, ShieldCheck, CreditCard, MessageSquare, Sparkles } from 'lucide-react'; 
import './ProductGrid.css';

const ProductGrid = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promociones, setPromociones] = useState([]);
  
  const { searchQuery, categoryFilter, sucursalFilter, setCategoryFilter } = useCart();

  useEffect(() => {
    getProducts();
    cargarPromociones();
  }, [sucursalFilter, categoryFilter]); 

  const cargarPromociones = async () => {
    try {
      const { data } = await supabase.from('promociones').select('*').eq('activa', true);
      
      if (data) {
        const hoy = new Date();
        hoy.setHours(0,0,0,0);

        const promosVigentes = data.filter(promo => {
          if (!promo.fecha_fin) return true;
          const fFin = new Date(promo.fecha_fin);
          fFin.setHours(23, 59, 59, 999);
          return hoy <= fFin;
        });
        
        setPromociones(promosVigentes);
      }
    } catch (error) { 
      console.error("Error promociones:", error); 
    }
  };

  async function getProducts() {
    try {
      setLoading(true);
      let query = supabase.from('productos').select('*, inventario_sucursal (*, sucursales (nombre))');
      
      if (sucursalFilter) {
        query = query.eq('inventario_sucursal.sucursal_id', sucursalFilter);
      }

      if (categoryFilter) {
        if (Array.isArray(categoryFilter)) {
          query = query.in('categoria_id', categoryFilter);
        } else {
          query = query.eq('categoria_id', categoryFilter);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const dataFinal = data.filter(p => p.inventario_sucursal && p.inventario_sucursal.length > 0);
      setProductos(dataFinal || []);
    } catch (error) { 
      console.error("Error productos:", error); 
    } finally { 
      setLoading(false);  
    }
  }

  const productosFiltrados = productos.filter((item) => 
    item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="shop-main-wrapper-premium">
      {/* BARRA DE FILTROS SUPERIOR ESTILO BOUTIQUE */}
      <div className="shop-header-luxury">
        <div className="header-text-luxury">
          <h2 className="title-luxury">
            {searchQuery ? (
              <>Resultados para: <span className="highlight-text">"{searchQuery}"</span></>
            ) : (
              <>Catálogo <span className="highlight-text">Exclusivo</span></>
            )}
          </h2>
          <p className="subtitle-luxury">Descubre piezas únicas diseñadas para ti ({productosFiltrados.length} productos)</p>
        </div>
        
        <div className="quick-filters-luxury">
          
          <button className="chip-luxury" onClick={() => setCategoryFilter([11, 12, 13, 14])}>💍 Joyería</button>
          <button className="chip-luxury" onClick={() => setCategoryFilter([19, 20, 21])}>👗 Ropa</button>
          <button className="chip-luxury" onClick={() => setCategoryFilter([44, 45, 46])}>🌹 Ramos</button>
          <button className="chip-luxury" onClick={() => setCategoryFilter([22, 23, 24, 25, 26])}>🎒 Accesorios</button>
        </div>
      </div> 

      <div className="shop-content-luxury">
        {loading ? (
          <div className="loader-container-luxury">
            <div className="loader-jai"></div>
            <p>Reflejando elegancia JAI...</p>
          </div>
        ) : (
          <div className="product-grid-luxury-main">
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((item) => (
                <ProductCard key={item.id} producto={item} listaPromociones={promociones} />
              ))
            ) : (
              <div className="no-results-luxury">
                <p>No encontramos productos que coincidan con tu búsqueda. 🌸</p>
                <button onClick={getProducts} className="reset-btn-simple">Volver a cargar</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER DE CONFIANZA (Debajo del Grid) */}
      <div className="trust-badges-luxury">
        <div className="badge-item"><Truck size={20}/> <span>Envíos Seguros</span></div>
        <div className="badge-item"><ShieldCheck size={20}/> <span>Calidad Garantizada</span></div>
        <div className="badge-item"><CreditCard size={20}/> <span>Pago Protegido</span></div>
        <div className="badge-item"><MessageSquare size={20}/> <span>Soporte 24/7</span></div>
      </div>
    </div>
  );
};

export default ProductGrid;