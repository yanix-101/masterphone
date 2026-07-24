import { useState } from 'react';
import { Language, Currency, Product } from '../types';
import { translations } from '../data/translations';
import { Star, ShoppingCart, SlidersHorizontal, Search, RotateCcw, ShieldCheck, Check, Zap } from 'lucide-react';

interface ProductCatalogProps {
  language: Language;
  currency: Currency;
  onAddToCart: (product: Product) => void;
  onDirectBuy?: (product: Product) => void;
  cartToast: string | null;
  productsList: Product[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  onViewDetails?: (product: Product) => void;
}

export default function ProductCatalog({
  language,
  currency,
  onAddToCart,
  onDirectBuy,
  cartToast,
  productsList,
  activeCategory,
  setActiveCategory,
  onViewDetails,
}: ProductCatalogProps) {
  const t = translations[language];

  // Filters State
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recommended');

  const categories = [
    { id: 'all', label: t.cat_all },
    { id: 'smartphones', label: language === 'en' ? 'Flagships' : 'الهواتف الرائدة' },
    { id: 'refurbished', label: t.nav_repair + ' / ' + t.label_refurbished },
    { id: 'parts', label: t.nav_parts },
    { id: 'tools', label: t.nav_tools },
  ];

  const formatPrice = (priceUsd: number) => {
    const dzdVal = Math.round(priceUsd * 220);
    return `${dzdVal.toLocaleString()} ${language === 'en' ? 'DZD' : 'د.ج'}`;
  };

  const getLabelTranslated = (condition: string) => {
    const uc = condition.toUpperCase();
    if (uc === 'REFURBISHED') return t.label_refurbished;
    if (uc === 'NEW') return t.label_new;
    if (uc === 'CERTIFIED' || uc === 'CERTIFIED A+') return t.label_certified;
    if (uc === 'HIGH CAP') return t.label_high_cap;
    if (uc === 'OEM QUALITY') return t.label_oem_quality;
    if (uc === 'PRO TOOLSET') return t.label_pro_toolset;
    return uc;
  };

  // Security: Whitelist & Sanitize user search query against XSS & script injection
  const ALLOWED_BRANDS = ['all', 'Apple', 'Samsung', 'Google', 'Xiaomi', 'Huawei', 'Realme', 'Oppo', 'Infinix', 'Other'];
  const ALLOWED_CONDITIONS = ['all', 'new', 'refurbished'];
  const ALLOWED_SORTS = ['recommended', 'low-high', 'high-low'];

  const sanitizeInput = (input: string): string => {
    return input
      .slice(0, 50) // Strict max 50 characters length
      .replace(/[<>{}"'\\]/g, ''); // Strip dangerous HTML tag delimiters & quotes
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(sanitizeInput(val));
  };

  const safeBrand = ALLOWED_BRANDS.includes(selectedBrand) ? selectedBrand : 'all';
  const safeCondition = ALLOWED_CONDITIONS.includes(selectedCondition) ? selectedCondition : 'all';
  const safeSort = ALLOWED_SORTS.includes(sortBy) ? sortBy : 'recommended';
  const safeSearch = searchQuery.trim().toLowerCase();

  // Filter & Sort Logic
  const filteredProducts = productsList.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesBrand = safeBrand === 'all' || p.brand === safeBrand;
    const matchesCondition = safeCondition === 'all' || 
      (safeCondition === 'new' && p.condition.toLowerCase() === 'new') ||
      (safeCondition === 'refurbished' && (p.condition.toLowerCase().includes('refurbished') || p.condition.toLowerCase().includes('certified') || p.condition.toLowerCase().includes('pre-owned') || p.condition.toLowerCase().includes('oem') || p.condition.toLowerCase().includes('tool') || p.condition.toLowerCase().includes('cap')));
    
    const matchesSearch = !safeSearch || 
      p.name.toLowerCase().includes(safeSearch) || 
      p.brand.toLowerCase().includes(safeSearch) ||
      p.condition.toLowerCase().includes(safeSearch) ||
      p.specEn.toLowerCase().includes(safeSearch) ||
      p.specAr.toLowerCase().includes(safeSearch);

    return matchesCategory && matchesBrand && matchesCondition && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (safeSort === 'low-high') return a.priceUsd - b.priceUsd;
    if (safeSort === 'high-low') return b.priceUsd - a.priceUsd;
    return b.rating - a.rating; // Default recommended = rating desc
  });

  const handleResetFilters = () => {
    setActiveCategory('all');
    setSelectedBrand('all');
    setSelectedCondition('all');
    setSearchQuery('');
    setSortBy('recommended');
  };

  const activeFiltersCount = (activeCategory !== 'all' ? 1 : 0) + 
    (safeBrand !== 'all' ? 1 : 0) + 
    (safeCondition !== 'all' ? 1 : 0) + 
    (safeSearch ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 text-left">
      
      {/* Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
            {t.cat_title}
          </h1>
          <p className="text-on-surface-variant text-xs md:text-sm mt-1 max-w-2xl">
            {t.cat_desc}
          </p>
        </div>

        {/* Security badge & warranty */}
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs text-emerald-400 font-semibold self-start sm:self-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{language === 'en' ? 'Verified Safe Hardware' : 'قطع غيار وفحوصات آمنة معتمدة'}</span>
        </div>
      </div>

      {/* Cart Toast Notification Feedback */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white font-bold text-sm px-6 py-4 rounded-xl flex items-center gap-3 shadow-lg animate-bounce border border-green-500">
          <Check className="w-5 h-5 text-white" />
          <span>{cartToast}</span>
        </div>
      )}

      {/* COMPACT TOP FILTER BAR (Space-saving & Highly Secure) */}
      <div className="bg-surface-container rounded-2xl p-3 md:p-4 border border-outline-variant/50 shadow-sm mb-8 space-y-3">
        
        {/* Row 1: Search & Category Chips */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Secure Live Search Bar */}
          <div className="relative flex-1 max-w-md">
            <input 
              type="text"
              maxLength={50}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={language === 'en' ? 'Search products safely...' : 'بحث سريع وآمن في المنتجات...'}
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl pl-9 pr-8 py-2 text-xs text-on-surface outline-none focus:border-primary-container font-semibold transition-colors"
            />
            <Search className="w-4 h-4 text-on-surface-variant/70 absolute left-3 top-2.5" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-on-surface-variant hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {categories.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === tab.id 
                    ? 'bg-primary-container text-on-primary-container shadow-sm' 
                    : 'bg-surface-container-highest hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Row 2: Compact Dropdown Controls & Quick Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
          
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter Label */}
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary-container" />
              <span>{t.cat_filters}</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary-container text-on-primary-container text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </span>

            {/* Brand Dropdown */}
            <select
              value={safeBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-bold focus:border-primary-container outline-none cursor-pointer"
            >
              <option value="all">{t.cat_brand}: {t.cat_all}</option>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Google">Google</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Huawei">Huawei</option>
              <option value="Realme">Realme</option>
              <option value="Oppo">Oppo</option>
              <option value="Infinix">Infinix</option>
              <option value="Other">{language === 'ar' ? 'ماركات أخرى' : 'Other Brands'}</option>
            </select>

            {/* Condition Dropdown */}
            <select
              value={safeCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-bold focus:border-primary-container outline-none cursor-pointer"
            >
              <option value="all">{t.cat_condition}: {t.cat_all}</option>
              <option value="new">{t.cat_brand_new}</option>
              <option value="refurbished">{t.cat_refurbished_ap}</option>
            </select>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
              <button 
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-primary-container hover:underline flex items-center gap-1 px-2 py-1 bg-primary-container/10 rounded-md cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'en' ? 'Reset' : 'تصفير'}</span>
              </button>
            )}

          </div>

          {/* Sort & Count */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-on-surface-variant font-mono">
              ({sortedProducts.length} {language === 'en' ? 'items' : 'منتج'})
            </span>

            <select
              value={safeSort}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-bold focus:border-primary-container outline-none cursor-pointer"
            >
              <option value="recommended">{t.cat_sort_recommended}</option>
              <option value="low-high">{t.cat_sort_low_high}</option>
              <option value="high-low">{t.cat_sort_high_low}</option>
            </select>
          </div>

        </div>

      </div>

      {/* Catalog products grid - Full Width (1 to 4 cols) */}
      {sortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {sortedProducts.map((p) => (
                <div 
                  key={p.id}
                  className="group flex flex-col justify-between h-full bg-surface-container rounded-2xl border border-outline-variant/60 hover:border-primary-container/40 transition-all duration-300 p-4 relative"
                >
                  {/* Clickable Image + Info */}
                  <div 
                    onClick={() => onViewDetails?.(p)}
                    className="cursor-pointer flex-1 flex flex-col"
                  >
                    {/* Image container */}
                    <div className="relative bg-surface-container-lowest rounded-xl aspect-[4/3] p-4 mb-4 flex items-center justify-center border border-outline-variant/20 overflow-hidden">
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 items-start">
                        <span className="bg-primary-container text-on-primary-container font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                          {getLabelTranslated(p.condition)}
                        </span>
                        {p.discountPercent && p.discountPercent > 0 && (
                          <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-md animate-pulse">
                            -{p.discountPercent}% {language === 'ar' ? 'خصم' : 'OFF'}
                          </span>
                        )}
                      </div>
                      
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-md border border-outline-variant/30 text-primary-container font-semibold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5 z-10">
                        <Star className="w-2.5 h-2.5 fill-primary-container text-primary-container" />
                        <span>{p.rating}</span>
                      </div>

                      {/* Detail Hover Overlay */}
                      <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                        <span className="bg-primary-container text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg uppercase tracking-wide">
                          {language === 'en' ? 'Quick View' : 'عرض التفاصيل'}
                        </span>
                      </div>

                      <img 
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 relative z-0" 
                        src={p.image} 
                        alt={p.name}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Info details */}
                    <div className="flex-1 flex flex-col justify-between text-left">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-base font-bold text-on-surface group-hover:text-primary-container transition-colors truncate">
                            {p.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-on-surface-variant font-medium">
                          {language === 'en' ? p.specEn : p.specAr}
                        </p>

                        {/* Stock Quantity Badge */}
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                            (p.stockQuantity ?? 10) === 0
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : (p.stockQuantity ?? 10) <= 3
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              (p.stockQuantity ?? 10) === 0 ? 'bg-red-500' : (p.stockQuantity ?? 10) <= 3 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            {(p.stockQuantity ?? 10) === 0
                              ? (language === 'ar' ? 'نفذت الكمية' : 'Out of Stock')
                              : `${language === 'ar' ? 'متوفر' : 'In Stock'}: ${p.stockQuantity ?? 10} ${language === 'ar' ? 'حبة' : 'units'}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action Row */}
                  <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-outline-variant/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                        {language === 'en' ? 'Price' : 'السعر'}
                      </span>
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-black text-primary-container block">
                          {formatPrice(p.priceUsd)}
                        </span>
                        {p.discountPercent && p.discountPercent > 0 && (
                          <span className="text-[11px] font-mono text-red-400 line-through block">
                            {Math.round((p.priceUsd / (1 - p.discountPercent / 100)) * 220).toLocaleString()} {language === 'en' ? 'DZD' : 'د.ج'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onAddToCart(p)}
                        className="px-2.5 py-1.5 bg-surface-container-highest hover:bg-surface-container-high border border-outline-variant/50 text-on-surface rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                        title={language === 'en' ? 'Add to cart' : 'إضافة إلى السلة'}
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-primary-container" />
                        <span>{language === 'en' ? 'Add' : 'سلة'}</span>
                      </button>

                      <button
                        onClick={() => onDirectBuy ? onDirectBuy(p) : onAddToCart(p)}
                        className="px-2.5 py-1.5 bg-primary-container hover:bg-primary-container/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-primary-container/20 active:scale-95"
                        title={language === 'en' ? 'Buy Now Directly' : 'شراء مباشر فوراً'}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>{language === 'en' ? 'Direct Buy' : 'شراء مباشر'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-surface-container rounded-2xl border border-outline-variant/40 space-y-4">
              <p className="text-on-surface-variant font-medium text-sm md:text-base">
                {language === 'en' ? 'No products matched your criteria.' : 'لم يتم العثور على أي منتج يطابق خيارات التصفية الحالية.'}
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-primary-container text-on-primary-container rounded-xl font-bold text-xs hover:scale-105 transition-transform cursor-pointer"
              >
                {language === 'en' ? 'Clear Filters' : 'مسح الفلاتر'}
              </button>
            </div>
          )}

    </div>
  );
}
