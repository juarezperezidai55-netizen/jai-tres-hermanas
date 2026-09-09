import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { ImageIcon, Plus, Trash2, X, Upload, ExternalLink } from 'lucide-react';
import './BannerAdmin.css';

const BannerAdmin = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nuevoBanner, setNuevoBanner] = useState({
    imagen_url: '', titulo: '', subtitulo: '', boton_texto: 'Comprar ahora', enlace: '/', orden: 0
  });

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data } = await supabase.from('banners').select('*').order('orden', { ascending: true });
    setBanners(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('banners').getPublicUrl(filePath);
      setNuevoBanner({ ...nuevoBanner, imagen_url: data.publicUrl });
      alert("Imagen cargada correctamente 🌸");

    } catch (error) {
      alert("Error al subir archivo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGuardar = async () => {
    if (!nuevoBanner.imagen_url) return alert("Falta la imagen del banner");
    
    const { error } = await supabase.from('banners').insert([
      { ...nuevoBanner, activo: true } 
    ]);

    if (error) {
      console.error("Error de Supabase:", error.message);
      return alert("Error al guardar: " + error.message);
    }

    setShowModal(false);
    fetchBanners();
    setNuevoBanner({ imagen_url: '', titulo: '', subtitulo: '', boton_texto: 'Comprar ahora', enlace: '/', orden: 0 });
    alert("¡Banner publicado con éxito! ✨");
  };

  const eliminarBanner = async (id) => {
    if (window.confirm("¿Eliminar este banner permanentemente?")) {
      await supabase.from('banners').delete().eq('id', id);
      fetchBanners();
    }
  };

  return (
    <div className="banner-admin-container animate-fade">
      <div className="admin-header-flex">
        <div className="header-info-main">
          <div className="icon-circle-bg">
             <ImageIcon size={24} color="#cf69d4" />
          </div>
          <div>
            <h3>Publicidad y Banners 🖼️</h3>
            <p>Gestiona la vitrina principal de JAI Market</p>
          </div>
        </div>
        <button className="btn-add-banner" onClick={() => setShowModal(true)}>
          <Plus size={18} /> <span className="hide-mobile">Crear Nuevo</span>
        </button>
      </div>

      <div className="banners-list-admin">
        {loading ? (
          <div className="loading-state-jai">Cargando galería...</div>
        ) : (
          banners.length === 0 ? (
            <div className="empty-txt-container">
              <ImageIcon size={40} color="#eee" />
              <p>No hay banners activos.</p>
            </div>
          ) : (
            <div className="banners-grid-layout">
              {banners.map((b) => (
                <div key={b.id} className="banner-luxury-card">
                  <div className="banner-card-img-wrapper">
                    <img src={b.imagen_url} alt="Preview" />
                    <div className="banner-order-tag">Orden: {b.orden}</div>
                  </div>
                  <div className="banner-card-info">
                    <div className="info-top">
                      <h4>{b.titulo || 'Sin título'}</h4>
                      <div className="link-badge">
                        <ExternalLink size={10} /> {b.enlace}
                      </div>
                    </div>
                    <p className="sub-txt">{b.subtitulo || 'Sin subtítulo'}</p>
                    <button onClick={() => eliminarBanner(b.id)} className="btn-delete-pro">
                      <Trash2 size={16}/> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {showModal && (
        <div className="modal-jai-overlay">
          <div className="modal-jai-content-pro animate-pop">
            <div className="modal-header-luxury">
              <div className="m-title">
                <Plus size={20} color="#cf69d4" />
                <h4>Nuevo Banner</h4>
              </div>
              <button onClick={() => setShowModal(false)} className="close-btn-jai"><X size={20} /></button>
            </div>
            
            <div className="modal-body-scrollable">
              <div className="input-group-jai">
                <label>Imagen Publicitaria</label>
                <div className="upload-wrapper-luxury">
                  <input type="file" id="file-up" hidden accept="image/*" onChange={handleFileUpload} />
                  <label htmlFor="file-up" className="upload-btn-styled">
                    {uploading ? "Subiendo..." : <><Upload size={16}/> Subir Archivo</>}
                  </label>
                  <div className="url-indicator">
                      {nuevoBanner.imagen_url ? "✅ Lista" : "⚠️ Requerida"}
                  </div>
                </div>
                <input 
                  type="text" 
                  className="jai-input"
                  placeholder="O pega una URL: https://..." 
                  value={nuevoBanner.imagen_url} 
                  onChange={e => setNuevoBanner({...nuevoBanner, imagen_url: e.target.value})} 
                />
              </div>

              <div className="input-row-responsive">
                <div className="input-group-jai">
                  <label>Título Principal</label>
                  <input type="text" className="jai-input" value={nuevoBanner.titulo} onChange={e => setNuevoBanner({...nuevoBanner, titulo: e.target.value})} />
                </div>
                <div className="input-group-jai">
                  <label>Subtítulo</label>
                  <input type="text" className="jai-input" value={nuevoBanner.subtitulo} onChange={e => setNuevoBanner({...nuevoBanner, subtitulo: e.target.value})} />
                </div>
              </div>

              <div className="input-row-responsive">
                <div className="input-group-jai">
                  <label>Texto del Botón</label>
                  <input type="text" className="jai-input" value={nuevoBanner.boton_texto} onChange={e => setNuevoBanner({...nuevoBanner, boton_texto: e.target.value})} />
                </div>
                <div className="input-group-jai">
                  <label>Orden</label>
                  <input type="number" className="jai-input" value={nuevoBanner.orden} onChange={e => setNuevoBanner({...nuevoBanner, orden: e.target.value})} />
                </div>
              </div>

              <div className="input-group-jai">
                <label>Vínculo (ID Categoría o Ruta)</label>
                <input 
                  type="text" 
                  className="jai-input"
                  placeholder="Ej: 14, 41, /atencion" 
                  value={nuevoBanner.enlace} 
                  onChange={e => setNuevoBanner({...nuevoBanner, enlace: e.target.value})} 
                />
                <div className="hint-luxury">
                   Usa <strong>IDs numéricos</strong> para categorías.
                </div>
              </div>
            </div>

            <div className="modal-footer-luxury">
              <button className="btn-cancel-jai" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-confirm-luxury" onClick={handleGuardar}>Publicar ✨</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerAdmin;