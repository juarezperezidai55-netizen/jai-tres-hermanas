import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useCart } from '../../context/CartContext';
import { ChevronRight } from 'lucide-react';
import './CategoryMenu.css';

const CategoryMenu = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const { setCategoryFilter, setSearchQuery } = useCart();

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('id, nombre, parent_id');
        
        if (error) throw error;
        if (data) setCategories(data);
      } catch (err) {
        console.error("Error cargando categorías:", err.message);
      }
    };

    if (isOpen) fetchCats();
  }, [isOpen]);

  // Función para manejar la selección
  const handleSelect = (id) => {
    setCategoryFilter(id); // Filtra los productos en el Grid
    setSearchQuery('');    // Limpia el buscador para que no choquen
    onClose();             // Cierra el menú
  };

  if (!isOpen) return null;

  // Separamos las categorías principales (las que no tienen papá)
  const principales = categories.filter(c => c.parent_id === null || c.parent_id === undefined);

  return (
    <div className="category-dropdown-wrapper">
      <ul className="main-cat-list">
        {/* Opción para ver todo de nuevo */}
        <li className="main-cat-item all-products" onClick={() => handleSelect(null)}>
          Ver Todos los Productos
        </li>

        {principales.map(cat => {
          // Buscamos si esta categoría tiene hijos (subcategorías)
          const subCategorias = categories.filter(sub => sub.parent_id === cat.id);

          return (
            <li key={cat.id} className="main-cat-item">
              <div className="cat-name-row" onClick={() => handleSelect(cat.id)}>
                {cat.nombre}
                {subCategorias.length > 0 && <ChevronRight size={14} />}
              </div>

              {/* Si tiene hijos, dibujamos el submenú lateral */}
              {subCategorias.length > 0 && (
                <ul className="sub-cat-list">
                  {subCategorias.map(sub => (
                    <li 
                      key={sub.id} 
                      className="sub-cat-item" 
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que se cierre el menú antes de tiempo
                        handleSelect(sub.id);
                      }}
                    >
                      {sub.nombre}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CategoryMenu;