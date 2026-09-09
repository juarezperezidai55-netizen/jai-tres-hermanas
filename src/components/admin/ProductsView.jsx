import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import StockSucursales from './StockSucursales';
import './ProductsView.css';

const ProductsView = ({ activeMenu, setActiveMenu }) => {
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadMethod, setUploadMethod] = useState('url');
  const [productData, setProductData] = useState({
    nombre: '', sku: '', categoria_id: '', precio: '', costo: '',
    stock: 0, imagen_url: '', descripcion: '', personalizacion: ''
  });
  const [listaVariantes, setListaVariantes] = useState([]);
  const [invData, setInvData] = useState({ producto_id: '', sucursal_id: '', cantidad: 0 });

  useEffect(() => { fetchData(); }, [activeMenu]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeMenu === 'listar_prod' || activeMenu === 'sucursales') {
        const { data: prods } = await supabase.from('productos').select('*').order('nombre');
        if (prods) setProductos(prods);
      }
      if (activeMenu === 'agregar_prod') {
        const { data: cats } = await supabase.from('categorias').select('*');
        if (cats) {
          const sorted = [];
          const padres = cats.filter(c => !c.parent_id);
          padres.forEach(padre => {
            sorted.push({ ...padre, nombre: padre.nombre.toUpperCase(), esPadre: true });
            const hijos = cats.filter(c => c.parent_id === padre.id);
            hijos.forEach(hijo => sorted.push({ ...hijo, nombre: `    ↳ ${hijo.nombre}`, esPadre: false }));
          });
          setCategorias(sorted);
        }
      }
      if (activeMenu === 'sucursales') {
        const { data: sucs } = await supabase.from('sucursales').select('*');
        if (sucs) setSucursales(sucs);
      }
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const handleAddVariantRow = () => {
    setListaVariantes([...listaVariantes, { nombre_variante: '', precio: productData.precio, stock: 0, imagen_variante_url: '', method: 'url' }]);
  };

  const handleRemoveVariantRow = (index) => {
    setListaVariantes(listaVariantes.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const nuevasVariantes = [...listaVariantes];
    nuevasVariantes[index][field] = value;
    setListaVariantes(nuevasVariantes);
  };

  const handleEditClick = async (p) => {
    setProductData({ ...p });
    const { data: vts } = await supabase.from('producto_variantes').select('*').eq('producto_maestro_id', p.id);
    setListaVariantes(vts?.map(v => ({ ...v, method: 'url' })) || []);
    setActiveMenu('agregar_prod');
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      nombre: productData.nombre, sku: productData.sku, categoria_id: parseInt(productData.categoria_id),
      precio: parseFloat(productData.precio), costo: parseFloat(productData.costo), stock: parseInt(productData.stock),
      imagen_url: productData.imagen_url, descripcion: productData.descripcion, personalizacion: productData.personalizacion
    };
    try {
      let prodId = productData.id;
      if (prodId) { await supabase.from('productos').update(payload).eq('id', prodId); }
      else {
        const { data: newProd, error } = await supabase.from('productos').insert([payload]).select().single();
        if (error) throw error;
        prodId = newProd.id;
      }
      if (listaVariantes.length > 0) {
        await supabase.from('producto_variantes').delete().eq('producto_maestro_id', prodId);
        const vFinales = listaVariantes.map(v => ({ producto_maestro_id: prodId, nombre_variante: v.nombre_variante, precio: parseFloat(v.precio || payload.precio), stock: parseInt(v.stock || 0), imagen_variante_url: v.imagen_variante_url || payload.imagen_url }));
        await supabase.from('producto_variantes').insert(vFinales);
      }
      alert("¡Guardado en JAI con éxito! ✨");
      setActiveMenu('listar_prod');
      fetchData();
    } catch (error) { alert("Error: " + error.message); }
    setLoading(false);
  };

  const handleDeleteProduct = async (id, nombre) => {
    if (window.confirm(`¿Estás segura de borrar "${nombre}"? 🌸`)) {
      setLoading(true);
      try {
        await supabase.from('inventario_sucursal').delete().eq('producto_id', id);
        await supabase.from('producto_variantes').delete().eq('producto_maestro_id', id);
        await supabase.from('productos').delete().eq('id', id);
        fetchData();
      } catch (error) { alert(error.message); }
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('productos-imagenes').upload(`products/${fileName}`, file);
      const { data } = supabase.storage.from('productos-imagenes').getPublicUrl(`products/${fileName}`);
      setProductData({ ...productData, imagen_url: data.publicUrl });
      alert("Imagen lista 🌸");
    } catch (error) { alert(error.message); }
    setLoading(false);
  };

  const handleUpdateStock = async () => {
    if(!invData.producto_id || !invData.sucursal_id) return alert("Seleccione producto y sucursal");
    setLoading(true);
    const pInv = { producto_id: parseInt(invData.producto_id), sucursal_id: parseInt(invData.sucursal_id), cantidad: parseInt(invData.cantidad) };
    const { error } = await supabase.from('inventario_sucursal').upsert(pInv, { onConflict: 'producto_id, sucursal_id' });
    if (!error) { alert("Stock actualizado 🏠"); fetchData(); }
    else { alert(error.message); }
    setLoading(false);
  };

  return (
    <>
      {activeMenu === 'listar_prod' && (
        <ProductList productos={productos} searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleEditClick={handleEditClick} handleDeleteProduct={handleDeleteProduct} />
      )}
      {activeMenu === 'agregar_prod' && (
        <ProductForm productData={productData} setProductData={setProductData} categorias={categorias} uploadMethod={uploadMethod} setUploadMethod={setUploadMethod} handleFileUpload={handleFileUpload} handleProductSubmit={handleProductSubmit} setActiveMenu={setActiveMenu} listaVariantes={listaVariantes} handleAddVariantRow={handleAddVariantRow} handleRemoveVariantRow={handleRemoveVariantRow} handleVariantChange={handleVariantChange} loading={loading} />
      )}
      {activeMenu === 'sucursales' && (
        <StockSucursales invData={invData} setInvData={setInvData} productos={productos} sucursales={sucursales} handleUpdateStock={handleUpdateStock} />
      )}
    </>
  );
};

export default ProductsView;