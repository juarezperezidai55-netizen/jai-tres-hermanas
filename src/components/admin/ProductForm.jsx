import React from 'react';
import { Save, Link as LinkIcon, Upload, Plus, Trash2, Package, Image as ImageIcon, Tag, DollarSign, FileText } from 'lucide-react';

const ProductForm = ({ 
  productData, setProductData, categorias, uploadMethod, setUploadMethod, 
  handleFileUpload, handleProductSubmit, setActiveMenu, 
  listaVariantes, handleAddVariantRow, handleRemoveVariantRow, handleVariantChange, handleVariantFileUpload,
  loading 
}) => {
  return (
    <form className="jai-form-modern" onSubmit={handleProductSubmit} style={{ animation: 'fadeIn 0.5s ease' }}>
      
      {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
      <div className="form-card-section" style={{ background: '#fff', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
          <Package size={20} color="#3b82f6"/>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{productData.id ? 'Editar Producto' : 'Información General'}</h3>
        </div>
        
        <div className="form-grid-modern" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div className="form-group-modern" style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569', display: 'block', marginBottom: '8px' }}>Nombre del Producto *</label>
            <input required type="text" value={productData.nombre} onChange={e => setProductData({...productData, nombre: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} placeholder="Ej: Vestido Floral / Ropa" />
          </div>
          <div className="form-group-modern">
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569', display: 'block', marginBottom: '8px' }}>SKU (Código Único) *</label>
            <input required type="text" value={productData.sku} onChange={e => setProductData({...productData, sku: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} placeholder="JAI-001" />
          </div>
          <div className="form-group-modern">
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569', display: 'block', marginBottom: '8px' }}>Categoría Exacta *</label>
            <select required value={productData.categoria_id} onChange={e => setProductData({...productData, categoria_id: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff' }}>
              <option value="">Seleccione...</option>
              {categorias.map(c => <option key={c.id} value={c.id} disabled={c.esPadre} style={{fontWeight: c.esPadre ? 'bold' : 'normal', color: c.esPadre ? '#003366' : '#333'}}>{c.nombre}</option>)}
            </select>
          </div>
         
<div className="form-group full">
  <label>Descripción del Producto 🌸</label>
  <textarea
    rows="4"
    placeholder="Escribe una descripción detallada para la tienda boutique..."
    value={productData.descripcion || ''}
    onChange={(e) => setProductData({ ...productData, descripcion: e.target.value })}
  />
</div>
        </div>
      </div>

      {/* SECCIÓN 2: IMAGEN PRINCIPAL */}
      <div className="form-card-section" style={{ background: '#fff', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
          <ImageIcon size={20} color="#3b82f6"/>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Imagen y Apariencia Principal</h3>
        </div>
        
        <div className="form-group-modern">
          <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569', display: 'block', marginBottom: '12px' }}>Método de Carga</label>
          <div className="method-selector" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button type="button" className={`btn-tab-modern ${uploadMethod === 'url' ? 'active' : ''}`} onClick={() => setUploadMethod('url')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: uploadMethod === 'url' ? '#3b82f6' : '#f8fafc', color: uploadMethod === 'url' ? '#fff' : '#64748b', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <LinkIcon size={16}/> URL
            </button>
            <button type="button" className={`btn-tab-modern ${uploadMethod === 'file' ? 'active' : ''}`} onClick={() => setUploadMethod('file')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: uploadMethod === 'file' ? '#3b82f6' : '#f8fafc', color: uploadMethod === 'file' ? '#fff' : '#64748b', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Upload size={16}/> Archivo
            </button>
          </div>
          {uploadMethod === 'url' ? (
            <input type="text" value={productData.imagen_url} onChange={e => setProductData({...productData, imagen_url: e.target.value})} placeholder="https://..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
          ) : (
            <div className="file-upload-zone" style={{ border: '2px dashed #cbd5e1', padding: '15px', borderRadius: '10px', textAlign: 'center', background: '#f8fafc' }}>
              <input type="file" accept="image/*" onChange={handleFileUpload} />
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 3: GESTIÓN DE VARIANTES (ROPA / COLORES) */}
      <div className="form-card-section" style={{ background: '#fff', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tag size={20} color="#16a34a"/>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Gestión de Variantes (Tallas y Colores)</h3>
          </div>
          <button type="button" onClick={handleAddVariantRow} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', cursor: 'pointer' }}>
            <Plus size={16}/> Añadir Variante
          </button>
        </div>
        
        <div className="variants-list">
          {listaVariantes.map((v, index) => (
            <div key={index} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '15px', alignItems: 'end', marginBottom: '15px' }}>
                <div className="form-group-modern">
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Nombre Variante (Ej: Rojo / Talla M)</label>
                  <input type="text" value={v.nombre_variante} onChange={(e) => handleVariantChange(index, 'nombre_variante', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div className="form-group-modern">
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Precio</label>
                  <input type="number" step="0.01" value={v.precio} onChange={(e) => handleVariantChange(index, 'precio', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div className="form-group-modern">
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Stock</label>
                  <input type="number" value={v.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <button type="button" onClick={() => handleRemoveVariantRow(index)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                  <Trash2 size={18}/>
                </button>
              </div>

              {/* REINTEGRACIÓN: Carga de Imagen por Variante */}
              <div className="variant-image-box" style={{ padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' }}>Imagen de esta Variante</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                   <button type="button" onClick={() => handleVariantChange(index, 'method', 'url')} style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e2e8f0', background: v.method === 'url' ? '#3b82f6' : '#fff', color: v.method === 'url' ? '#fff' : '#64748b' }}>URL</button>
                   <button type="button" onClick={() => handleVariantChange(index, 'method', 'file')} style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e2e8f0', background: v.method === 'file' ? '#3b82f6' : '#fff', color: v.method === 'file' ? '#fff' : '#64748b' }}>ARCHIVO</button>
                </div>
                {v.method === 'url' ? (
                  <input type="text" placeholder="URL..." value={v.imagen_variante_url} onChange={(e) => handleVariantChange(index, 'imagen_variante_url', e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                ) : (
                  <input type="file" accept="image/*" onChange={(e) => handleVariantFileUpload(e, index)} style={{ fontSize: '12px' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 4: COSTOS Y DETALLES */}
      <div className="form-card-section" style={{ background: '#fff', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
          <DollarSign size={20} color="#3b82f6"/>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Costos y Detalles Finales</h3>
        </div>
        <div className="form-grid-modern" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="form-group-modern">
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569', display: 'block', marginBottom: '8px' }}>Precio Base *</label>
            <input required type="number" step="0.01" value={productData.precio} onChange={e => setProductData({...productData, precio: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          </div>
          <div className="form-group-modern">
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569', display: 'block', marginBottom: '8px' }}>Costo de Compra *</label>
            <input required type="number" step="0.01" value={productData.costo} onChange={e => setProductData({...productData, costo: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          </div>
          <div className="form-group-modern">
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569', display: 'block', marginBottom: '8px' }}>Stock Global</label>
            <input type="number" value={productData.stock} onChange={e => setProductData({...productData, stock: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          </div>
          <div className="form-group-modern" style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569', display: 'block', marginBottom: '8px' }}>Personalización</label>
            <textarea rows="2" value={productData.personalizacion} onChange={e => setProductData({...productData, personalizacion: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'none' }}></textarea>
          </div>
        </div>
      </div>

      <div className="form-footer-modern" style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
        <button type="button" className="btn-cancel" onClick={() => setActiveMenu('listar_prod')} style={{ padding: '12px 25px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
        <button type="submit" className="btn-submit" disabled={loading} style={{ padding: '12px 35px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Save size={20}/> {productData.id ? 'Actualizar Producto' : 'Registrar en JAI ✨'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;