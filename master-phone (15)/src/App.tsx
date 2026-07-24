import { useState, useEffect } from 'react';
import { Screen, Language, Currency, RepairTicket, InventoryAlert, Product, CartItem, Order, RepairServiceItem } from './types';
import { products as defaultProducts } from './data/products';
import { defaultRepairServices } from './data/repairServices';
import TopNavBar from './components/TopNavBar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import FeaturedProducts from './components/FeaturedProducts';
import DiagnosticCTA from './components/DiagnosticCTA';
import BookRepairFlow from './components/BookRepairFlow';
import ProductCatalog from './components/ProductCatalog';
import CheckoutFlow from './components/CheckoutFlow';
import OpsDashboard from './components/OpsDashboard';
import Footer from './components/Footer';
import ProductDetailsModal from './components/ProductDetailsModal';
import { db, collection, onSnapshot, doc, setDoc, deleteDoc } from './lib/firebase';

export default function App() {
  // Core UI/State
  const [currentScreen, setScreen] = useState<Screen>('landing');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [language, setLanguage] = useState<Language>('en');

  // Baridimob RIP and Contact Phones state
  const [ripNumber, setRipNumber] = useState<string>(() => {
    const saved = localStorage.getItem('mp_rip_number');
    return saved || '007999990023456789 23';
  });

  const [contactPhones, setContactPhones] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mp_contact_phones');
      return saved ? JSON.parse(saved) : ['0555 12 34 56', '0666 78 90 12'];
    } catch {
      return ['0555 12 34 56', '0666 78 90 12'];
    }
  });

  const [socialLinks, setSocialLinks] = useState<{ instagram: string; tiktok: string; facebook: string }>(() => {
    try {
      const saved = localStorage.getItem('mp_social_links');
      return saved ? JSON.parse(saved) : {
        instagram: 'https://instagram.com/dz_repair',
        tiktok: 'https://tiktok.com/@dz_repair',
        facebook: 'https://facebook.com/dz_repair'
      };
    } catch {
      return {
        instagram: 'https://instagram.com/dz_repair',
        tiktok: 'https://tiktok.com/@dz_repair',
        facebook: 'https://facebook.com/dz_repair'
      };
    }
  });

  // Repair Services & Prices state (persists in localStorage)
  const [repairServices, setRepairServices] = useState<RepairServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem('mp_repair_services');
      return saved ? JSON.parse(saved) : defaultRepairServices;
    } catch {
      return defaultRepairServices;
    }
  });

  useEffect(() => {
    localStorage.setItem('mp_repair_services', JSON.stringify(repairServices));
  }, [repairServices]);

  const handleUpdateRepairService = (updatedService: RepairServiceItem) => {
    setRepairServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const handleAddRepairService = (newService: RepairServiceItem) => {
    setRepairServices(prev => [...prev, newService]);
  };

  const handleDeleteRepairService = (id: string) => {
    setRepairServices(prev => prev.filter(s => s.id !== id));
  };

  const handleRestoreDefaultRepairServices = () => {
    setRepairServices(defaultRepairServices);
    localStorage.setItem('mp_repair_services', JSON.stringify(defaultRepairServices));
  };

  const handleNavigate = (screen: Screen, category?: string) => {
    setScreen(screen);
    if (screen === 'catalog') {
      setCatalogCategory(category || 'all');
    }
  };
  const [currency, setCurrency] = useState<Currency>('DZD'); // Default to Algerian Dinar for local relevance!
  
  // Theme state: Reads saved preference or auto-detects system dark/light mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('mp_theme');
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [cartToast, setCartToast] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Sync dark/light theme to document root & localStorage
  useEffect(() => {
    localStorage.setItem('mp_theme', isDarkMode ? 'dark' : 'light');
    const htmlDoc = document.documentElement;
    if (isDarkMode) {
      htmlDoc.classList.add('dark');
      htmlDoc.classList.remove('app-light');
    } else {
      htmlDoc.classList.remove('dark');
      htmlDoc.classList.add('app-light');
    }
  }, [isDarkMode]);

  // Listen for system theme changes (auto dark/light mode switch)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('mp_theme')) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Force auto-cleanup on fresh store handover version
  useEffect(() => {
    const freshVersion = localStorage.getItem('mp_fresh_handover_v5');
    if (!freshVersion) {
      localStorage.setItem('mp_fresh_handover_v5', 'done');
      localStorage.setItem('mp_orders', JSON.stringify([]));
      localStorage.setItem('mp_tickets', JSON.stringify([]));
      localStorage.setItem('mp_cart', JSON.stringify([]));
      localStorage.setItem('mp_sales_baseline', '0');
      setOrders([]);
      setTickets([]);
      setCart([]);
      setSalesBaseline(0);
    }
  }, []);

  // Stateful Products list for full CRUD in dashboard (persists in localStorage)
  const [productsList, setProductsList] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('mp_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return defaultProducts;
  });

  // Real-time Firestore sync for Products, Orders, and Tickets
  useEffect(() => {
    // 1. Sync Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        const fetchedProducts: Product[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const docId = docSnap.id || data.id || `p-${Date.now()}`;
          return {
            id: docId,
            name: data.name || 'Product',
            price: data.price ?? Math.round((data.priceUsd ?? 0) * 220),
            priceUsd: data.priceUsd ?? (data.price ? data.price / 220 : 0),
            image: data.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMnB6OIbC6bOlwiYfurQBrwHBKQ2P6D5rqGp0uK3PcvoA_FqTSuv15M7z7M4Rkp1-u6GgxdT-HC1VfG_dPP2NqpwI2jEZvLR3MXTxk3XlAuxNbzMKl4ot8CCJVfVyhuO3oRr50c-L2BYA-QIsq12xf2WyhLH7292AjmaISvKGorMiL-IK5ClSpntyOSCJVdwcI_1WELAM0K-nSSDFAe1tJs7ZGX7JGa_Elrj9qssvRSGJNyFxZb1b6fPEXvBYOAEcAcGzR9CPy0-g',
            brand: data.brand || 'Other',
            storage: data.storage || '128GB',
            color: data.color || 'Black',
            condition: data.condition || 'New',
            stock: data.stock ?? data.stockQuantity ?? 10,
            stockQuantity: data.stockQuantity ?? data.stock ?? 10,
            description: data.description || data.specAr || data.specEn || '',
            createdAt: data.createdAt || new Date().toISOString(),
            category: data.category || 'smartphones',
            specEn: data.specEn || data.description || 'High Quality',
            specAr: data.specAr || data.description || 'مواصفات أصلية',
            rating: data.rating ?? 4.8,
            images: Array.isArray(data.images) && data.images.length > 0 ? data.images : [data.image || ''],
            warrantyMonths: data.warrantyMonths ?? 12,
            discountPercent: data.discountPercent ?? 0,
          } as Product;
        });
        setProductsList(fetchedProducts);
      } else {
        // Only seed default products ONCE if never seeded before
        const alreadySeeded = localStorage.getItem('mp_products_seeded');
        if (!alreadySeeded) {
          localStorage.setItem('mp_products_seeded', 'true');
          defaultProducts.forEach((p) => {
            const docData = JSON.parse(JSON.stringify({
              id: p.id,
              name: p.name,
              price: Math.round(p.priceUsd * 220),
              priceUsd: p.priceUsd,
              image: p.image,
              brand: p.brand,
              storage: p.storage || '128GB',
              color: p.color || 'Black',
              condition: p.condition,
              stock: p.stockQuantity ?? 10,
              stockQuantity: p.stockQuantity ?? 10,
              description: p.specAr || p.specEn || p.name,
              createdAt: new Date().toISOString(),
              category: p.category,
              specEn: p.specEn,
              specAr: p.specAr,
              rating: p.rating,
              images: p.images || [p.image],
              warrantyMonths: p.warrantyMonths ?? 12,
              discountPercent: p.discountPercent ?? 0,
            }));
            setDoc(doc(db, 'products', p.id), docData).catch((err) => console.error("Firestore seed product error:", err));
          });
        } else {
          // Explicitly clear list when user deletes all items
          setProductsList([]);
        }
      }
    }, (err) => {
      console.warn("Firestore products snapshot error:", err);
    });

    // 2. Sync Orders
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      if (!snapshot.empty) {
        const fetchedOrders: Order[] = snapshot.docs.map(docSnap => docSnap.data() as Order);
        setOrders(fetchedOrders);
      } else {
        setOrders([]);
      }
    }, (err) => {
      console.warn("Firestore orders snapshot error:", err);
    });

    // 3. Sync Tickets
    const unsubTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      if (!snapshot.empty) {
        const fetchedTickets: RepairTicket[] = snapshot.docs.map(docSnap => docSnap.data() as RepairTicket);
        setTickets(fetchedTickets);
      } else {
        setTickets([]);
      }
    }, (err) => {
      console.warn("Firestore tickets snapshot error:", err);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubTickets();
    };
  }, []);

  const handleClearProducts = () => {
    localStorage.setItem('mp_products_seeded', 'true');
    setProductsList([]);
    localStorage.setItem('mp_products', JSON.stringify([]));
    productsList.forEach((p) => {
      deleteDoc(doc(db, 'products', p.id)).catch(() => {});
    });
  };

  const handleRestoreDefaultProducts = () => {
    localStorage.setItem('mp_products_seeded', 'true');
    setProductsList(defaultProducts);
    localStorage.setItem('mp_products', JSON.stringify(defaultProducts));
    defaultProducts.forEach((p) => {
      setDoc(doc(db, 'products', p.id), p).catch(() => {});
    });
  };

  // Stateful Cart array (persists in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mp_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Stateful Orders array (persists in localStorage)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('mp_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Stateful Baseline Sales Revenue (persists in localStorage, defaults to 0)
  const [salesBaseline, setSalesBaseline] = useState<number>(() => {
    const saved = localStorage.getItem('mp_sales_baseline');
    if (!saved || saved === '12482') {
      localStorage.setItem('mp_sales_baseline', '0');
      return 0;
    }
    return Number(saved) || 0;
  });

  useEffect(() => {
    localStorage.setItem('mp_sales_baseline', salesBaseline.toString());
  }, [salesBaseline]);

  const handleResetMetrics = () => {
    setSalesBaseline(0);
    setOrders([]);
    setTickets([]);
    setCart([]);
    localStorage.setItem('mp_sales_baseline', '0');
    localStorage.setItem('mp_orders', JSON.stringify([]));
    localStorage.setItem('mp_tickets', JSON.stringify([]));
    localStorage.setItem('mp_cart', JSON.stringify([]));
    orders.forEach((o) => deleteDoc(doc(db, 'orders', o.id)).catch(() => {}));
    tickets.forEach((t) => deleteDoc(doc(db, 'tickets', t.id)).catch(() => {}));
  };

  const handleZeroAllDataAndProducts = () => {
    localStorage.setItem('mp_products_seeded', 'true');
    setSalesBaseline(0);
    setOrders([]);
    setTickets([]);
    setCart([]);
    setProductsList([]);
    localStorage.setItem('mp_sales_baseline', '0');
    localStorage.setItem('mp_orders', JSON.stringify([]));
    localStorage.setItem('mp_tickets', JSON.stringify([]));
    localStorage.setItem('mp_cart', JSON.stringify([]));
    localStorage.setItem('mp_products', JSON.stringify([]));
    productsList.forEach((p) => deleteDoc(doc(db, 'products', p.id)).catch(() => {}));
    orders.forEach((o) => deleteDoc(doc(db, 'orders', o.id)).catch(() => {}));
    tickets.forEach((t) => deleteDoc(doc(db, 'tickets', t.id)).catch(() => {}));
  };

  const handleRestoreDemoMetrics = () => {
    setSalesBaseline(12482);
    setProductsList(defaultProducts);
    setTickets([
      {
        id: '#MP-9942',
        device: 'iPhone 14 Pro (Screen Damage)',
        deviceType: 'smartphone',
        customer: 'Yanis Win',
        wilayaCode: '16',
        status: 'waiting',
        technician: 'Sarah J.',
      },
      {
        id: '#MP-9811',
        device: 'iPad Pro 11" (Battery Issues)',
        deviceType: 'tablet',
        customer: 'Sonia K.',
        wilayaCode: '31',
        status: 'completed',
        technician: 'Mourad A.',
      }
    ]);
    localStorage.setItem('mp_sales_baseline', '12482');
    localStorage.setItem('mp_products', JSON.stringify(defaultProducts));
  };

  // Initial Repair Tickets (Stateful so booking a repair appends to the queue live!)
  const [tickets, setTickets] = useState<RepairTicket[]>(() => {
    try {
      const saved = localStorage.getItem('mp_tickets');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Initial Inventory parts state (Stateful so restocking resolves alerts live!)
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>(() => {
    try {
      const saved = localStorage.getItem('mp_inventory');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'inv-1',
        partName: 'iPhone 15 Pro OLED Panel',
        stock: 2,
        criticalLimit: 5,
      },
      {
        id: 'inv-2',
        partName: 'S24 Ultra Li-ion Replacement Battery',
        stock: 4,
        criticalLimit: 8,
      },
      {
        id: 'inv-3',
        partName: 'Pixel 8 Pro Charging Port Flex',
        stock: 1,
        criticalLimit: 3,
      },
    ];
  });

  // Derived state: Cart items count
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Sync states to localStorage
  useEffect(() => {
    localStorage.setItem('mp_products', JSON.stringify(productsList));
  }, [productsList]);

  useEffect(() => {
    localStorage.setItem('mp_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('mp_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('mp_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('mp_inventory', JSON.stringify(inventoryAlerts));
  }, [inventoryAlerts]);

  useEffect(() => {
    localStorage.setItem('mp_rip_number', ripNumber);
  }, [ripNumber]);

  useEffect(() => {
    localStorage.setItem('mp_contact_phones', JSON.stringify(contactPhones));
  }, [contactPhones]);

  useEffect(() => {
    localStorage.setItem('mp_social_links', JSON.stringify(socialLinks));
  }, [socialLinks]);

  // Handle document language RTL support
  useEffect(() => {
    const htmlDoc = document.documentElement;
    if (language === 'ar') {
      htmlDoc.dir = 'rtl';
      htmlDoc.lang = 'ar';
    } else {
      htmlDoc.dir = 'ltr';
      htmlDoc.lang = 'en';
    }
  }, [language]);

  // Actions
  const handleAddTicket = (newTkt: RepairTicket) => {
    setTickets((prev) => [newTkt, ...prev]);
    setDoc(doc(db, 'tickets', newTkt.id), newTkt).catch((err) => console.error("Firestore add ticket error:", err));
  };

  const handleChangeTicketStatus = (id: string, newStatus: 'diagnostic' | 'waiting' | 'completed') => {
    setTickets((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
      const found = updated.find((t) => t.id === id);
      if (found) {
        setDoc(doc(db, 'tickets', id), found).catch(() => {});
      }
      return updated;
    });
  };

  const handleRestockPart = (id: string) => {
    setInventoryAlerts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: 12 } : p)) // restocks to 12
    );
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    setCartToast(language === 'en' ? `Added ${product.name} to cart!` : `تمت إضافة ${product.name} للسلة!`);
    
    // Clear toast
    setTimeout(() => {
      setCartToast(null);
    }, 2500);
  };

  // Direct Buy / Express Checkout (Add to cart + immediate checkout navigation)
  const handleDirectBuy = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setScreen('checkout');
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Order Placement
  const handlePlaceOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setDoc(doc(db, 'orders', newOrder.id), newOrder).catch((err) => console.error("Firestore add order error:", err));
  };

  const handleChangeOrderStatus = (id: string, newStatus: 'pending' | 'shipped' | 'delivered') => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o));
      const found = updated.find((o) => o.id === id);
      if (found) {
        setDoc(doc(db, 'orders', id), found).catch(() => {});
      }
      return updated;
    });
  };

  // Product CRUD
  const handleAddProduct = async (newProd: Product) => {
    const docData = JSON.parse(JSON.stringify({
      id: newProd.id,
      name: newProd.name,
      price: newProd.price ?? Math.round(newProd.priceUsd * 220),
      priceUsd: newProd.priceUsd,
      image: newProd.image,
      brand: newProd.brand,
      storage: newProd.storage || '128GB',
      color: newProd.color || 'Black',
      condition: newProd.condition,
      stock: newProd.stock ?? newProd.stockQuantity ?? 10,
      stockQuantity: newProd.stockQuantity ?? newProd.stock ?? 10,
      description: newProd.description || newProd.specAr || newProd.specEn || newProd.name,
      createdAt: newProd.createdAt || new Date().toISOString(),
      category: newProd.category,
      specEn: newProd.specEn,
      specAr: newProd.specAr,
      rating: newProd.rating ?? 4.8,
      images: newProd.images || [newProd.image],
      warrantyMonths: newProd.warrantyMonths ?? 12,
      discountPercent: newProd.discountPercent ?? 0,
    }));

    setProductsList((prev) => [newProd, ...prev.filter(p => p.id !== newProd.id)]);
    try {
      await setDoc(doc(db, 'products', newProd.id), docData);
      console.log("Successfully wrote product to Firestore:", newProd.id, docData);
    } catch (err) {
      console.error("Firestore add product error:", err);
    }
  };

  const handleUpdateProduct = async (updatedProd: Product) => {
    const docData = JSON.parse(JSON.stringify({
      id: updatedProd.id,
      name: updatedProd.name,
      price: updatedProd.price ?? Math.round(updatedProd.priceUsd * 220),
      priceUsd: updatedProd.priceUsd,
      image: updatedProd.image,
      brand: updatedProd.brand,
      storage: updatedProd.storage || '128GB',
      color: updatedProd.color || 'Black',
      condition: updatedProd.condition,
      stock: updatedProd.stock ?? updatedProd.stockQuantity ?? 10,
      stockQuantity: updatedProd.stockQuantity ?? updatedProd.stock ?? 10,
      description: updatedProd.description || updatedProd.specAr || updatedProd.specEn || updatedProd.name,
      createdAt: updatedProd.createdAt || new Date().toISOString(),
      category: updatedProd.category,
      specEn: updatedProd.specEn,
      specAr: updatedProd.specAr,
      rating: updatedProd.rating ?? 4.8,
      images: updatedProd.images || [updatedProd.image],
      warrantyMonths: updatedProd.warrantyMonths ?? 12,
      discountPercent: updatedProd.discountPercent ?? 0,
    }));

    setProductsList((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    );
    try {
      await setDoc(doc(db, 'products', updatedProd.id), docData);
      console.log("Successfully updated product in Firestore:", updatedProd.id, docData);
    } catch (err) {
      console.error("Firestore update product error:", err);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    localStorage.setItem('mp_products_seeded', 'true');
    setProductsList((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      localStorage.setItem('mp_products', JSON.stringify(updated));
      return updated;
    });
    deleteDoc(doc(db, 'products', productId)).catch((err) => console.error("Firestore delete product error:", err));
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets((prev) => {
      const updated = prev.filter((t) => t.id !== ticketId);
      localStorage.setItem('mp_tickets', JSON.stringify(updated));
      return updated;
    });
    deleteDoc(doc(db, 'tickets', ticketId)).catch((err) => console.error("Firestore delete ticket error:", err));
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== orderId);
      localStorage.setItem('mp_orders', JSON.stringify(updated));
      return updated;
    });
    deleteDoc(doc(db, 'orders', orderId)).catch((err) => console.error("Firestore delete order error:", err));
  };

  // Scroll to top on screen transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-background text-on-surface app-dark' 
        : 'bg-stone-50 text-stone-900 app-light'
    }`}>
      {/* Dynamic Top Navigation Header */}
      <TopNavBar
        currentScreen={currentScreen}
        setScreen={handleNavigate}
        language={language}
        setLanguage={setLanguage}
        currency={currency}
        setCurrency={setCurrency}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        cartCount={cartCount}
      />

      {/* Main Content Area framed by padded container for visual balance */}
      <main className="pt-24 min-h-[75vh]">
        
        {/* LANDING HOMEPAGE SCREEN */}
        {currentScreen === 'landing' && (
          <div className="space-y-4">
            <HeroSection language={language} setScreen={setScreen} />
            <FeaturesSection language={language} />
            <FeaturedProducts 
              language={language} 
              currency={currency} 
              setScreen={setScreen} 
              onAddToCart={handleAddToCart}
              onDirectBuy={handleDirectBuy} 
              productsList={productsList}
              onViewDetails={setSelectedProduct}
            />
            <DiagnosticCTA language={language} setScreen={setScreen} />

            {/* Elegant Dynamic Contact Section */}
            <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
              <div className="bg-surface-container/60 border border-outline-variant/20 rounded-3xl p-8 flex flex-col lg:flex-row gap-8 justify-between items-center relative overflow-hidden">
                <div className="space-y-3 max-w-xl text-left">
                  <span className="text-[10px] font-black tracking-widest text-primary-container uppercase bg-primary-container/10 border border-primary-container/20 px-2.5 py-1 rounded">
                    {language === 'ar' ? 'اتصل بنا ودعم العملاء' : 'CONTACT & SUPPORT'}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                    {language === 'ar' ? 'هل لديك أي استفسار؟ نحن هنا لخدمتك' : 'Have any questions? We are here to help'}
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    {language === 'ar' 
                      ? 'تواصل معنا مباشرة عبر الأرقام الهاتفية الرسمية لخدمة العملاء والدعم الفني السريع.' 
                      : 'Reach out to our team directly through our official customer support phone lines.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  {contactPhones.map((phone, index) => (
                    <a
                      key={index}
                      href={`tel:${phone.replace(/\s+/g, '')}`}
                      className="bg-surface-container-highest/60 hover:bg-primary-container hover:text-white border border-outline-variant/40 rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-105 shadow font-mono text-base font-black text-white cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container hover:bg-white/20 hover:text-white transition-colors">
                        📞
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] block text-on-surface-variant font-sans uppercase font-extrabold">
                          {language === 'ar' ? `خط التواصل #${index + 1}` : `SUPPORT LINE #${index + 1}`}
                        </span>
                        <span>{phone}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* BOOK REPAIR WIZARD SCREEN */}
        {currentScreen === 'repair' && (
          <BookRepairFlow
            language={language}
            currency={currency}
            onAddTicket={handleAddTicket}
            setScreen={setScreen}
            repairServices={repairServices}
          />
        )}

        {/* SHOP PRODUCT CATALOG SCREEN */}
        {currentScreen === 'catalog' && (
          <ProductCatalog
            language={language}
            currency={currency}
            onAddToCart={handleAddToCart}
            onDirectBuy={handleDirectBuy}
            cartToast={cartToast}
            productsList={productsList}
            activeCategory={catalogCategory}
            setActiveCategory={setCatalogCategory}
            onViewDetails={setSelectedProduct}
          />
        )}

        {/* SECURE CHECKOUT FLOW SCREEN */}
        {currentScreen === 'checkout' && (
          <CheckoutFlow
            language={language}
            currency={currency}
            cart={cart}
            onClearCart={handleClearCart}
            onPlaceOrder={handlePlaceOrder}
            setScreen={setScreen}
            ripNumber={ripNumber}
          />
        )}

        {/* OPERATIONS ADMIN DASHBOARD SCREEN */}
        {currentScreen === 'dashboard' && (
          <OpsDashboard
            language={language}
            currency={currency}
            tickets={tickets}
            onChangeTicketStatus={handleChangeTicketStatus}
            onDeleteTicket={handleDeleteTicket}
            onRestockPart={handleRestockPart}
            inventoryAlerts={inventoryAlerts}
            productsList={productsList}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            orders={orders}
            onChangeOrderStatus={handleChangeOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            ripNumber={ripNumber}
            setRipNumber={setRipNumber}
            contactPhones={contactPhones}
            setContactPhones={setContactPhones}
            socialLinks={socialLinks}
            setSocialLinks={setSocialLinks}
            salesBaseline={salesBaseline}
            onResetMetrics={handleResetMetrics}
            onRestoreDemoMetrics={handleRestoreDemoMetrics}
            onClearProducts={handleClearProducts}
            onRestoreDefaultProducts={handleRestoreDefaultProducts}
            onZeroAllDataAndProducts={handleZeroAllDataAndProducts}
            repairServices={repairServices}
            onUpdateRepairService={handleUpdateRepairService}
            onAddRepairService={handleAddRepairService}
            onDeleteRepairService={handleDeleteRepairService}
            onRestoreDefaultRepairServices={handleRestoreDefaultRepairServices}
          />
        )}

      </main>

      {/* Product Details Modal Overlay */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          language={language}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onDirectBuy={handleDirectBuy}
        />
      )}

      {/* Premium Global Footer */}
      <Footer language={language} setScreen={handleNavigate} contactPhones={contactPhones} socialLinks={socialLinks} />
    </div>
  );
}
