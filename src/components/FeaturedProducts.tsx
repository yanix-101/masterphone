import { Language, Currency, Screen, Product } from '../types';
import { translations } from '../data/translations';
import { ArrowLeft, ArrowRight, ShoppingCart, Star, Zap } from 'lucide-react';
import { useState } from 'react';

interface FeaturedProductsProps {
  language: Language;
  currency: Currency;
  setScreen: (screen: Screen) => void;
  onAddToCart: (product: Product) => void;
  onDirectBuy?: (product: Product) => void;
  productsList: Product[];
  onViewDetails?: (product: Product) => void;
}

export default function FeaturedProducts({
  language,
  currency,
  setScreen,
  onAddToCart,
  onDirectBuy,
  productsList,
  onViewDetails,
}: FeaturedProductsProps) {
  const t = translations[language];

  // We show 4 products for the homepage from the stateful productsList
  const featured = productsList.slice(0, 4);

  // Currency Converter
  const formatPrice = (priceUsd: number) => {
    const dzdVal = Math.round(priceUsd * 220);
    return `${dzdVal.toLocaleString()} ${language === 'en' ? 'DZD' : 'د.ج'}`;
  };

  const getLabelTranslated = (condition: string) => {
    if (condition.toUpperCase() === 'REFURBISHED') return t.label_refurbished;
    if (condition.toUpperCase() === 'NEW') return t.label_new;
    if (condition.toUpperCase() === 'CERTIFIED') return t.label_certified;
    return condition.toUpperCase();
  };

  return (
    <section className="py-24 px-4 md:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-on-surface">
              {t.hardware_title}
            </h2>
            <p className="text-on-surface-variant text-base">
              {t.hardware_desc}
            </p>
          </div>
          
          {/* Action Carousel buttons - triggers catalog navigation */}
          <div className="flex gap-3">
            <button 
              onClick={() => setScreen('catalog')}
              className="p-3 border border-outline-variant rounded-full hover:bg-surface-container-high hover:border-primary-container/40 transition-colors cursor-pointer active:scale-90"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
            <button 
              onClick={() => setScreen('catalog')}
              className="p-3 border border-outline-variant rounded-full hover:bg-surface-container-high hover:border-primary-container/40 transition-colors cursor-pointer active:scale-90"
            >
              <ArrowRight className="w-5 h-5 text-on-surface" />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map((p) => (
              <div 
                key={p.id}
                className="group flex flex-col justify-between h-full bg-surface-container rounded-3xl border border-outline-variant/60 hover:border-primary-container/40 transition-all duration-300 p-5 overflow-hidden"
              >
                {/* Clickable Image + Info */}
                <div 
                  onClick={() => onViewDetails?.(p)}
                  className="cursor-pointer flex-1 flex flex-col"
                >
                  {/* Product Visual Container */}
                  <div className="relative bg-surface-container-lowest rounded-2xl aspect-[3/4] p-4 mb-4 flex items-center justify-center overflow-hidden border border-outline-variant/30">
                    
                    {/* Condition Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 items-start">
                      <span className="bg-primary-container text-on-primary-container font-bold text-[10px] px-2.5 py-1 rounded tracking-wider uppercase">
                        {getLabelTranslated(p.condition)}
                      </span>
                      {p.discountPercent && p.discountPercent > 0 && (
                        <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-md animate-pulse">
                          -{p.discountPercent}% {language === 'ar' ? 'خصم' : 'OFF'}
                        </span>
                      )}
                    </div>

                    {/* Rating badge */}
                    <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md border border-outline-variant/30 text-primary-container font-semibold text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5 z-10">
                      <Star className="w-3 h-3 fill-primary-container text-primary-container" />
                      <span>{p.rating}</span>
                    </div>

                    {/* Detail Hover Overlay */}
                    <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                      <span className="bg-primary-container text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg uppercase tracking-wide">
                        {language === 'en' ? 'Quick View' : 'عرض التفاصيل'}
                      </span>
                    </div>

                    <img 
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 relative z-0"
                      src={p.image}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Product Meta */}
                  <div className="text-left flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg md:text-xl font-bold mb-1 text-on-surface group-hover:text-primary-container transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-on-surface-variant text-xs mb-2 font-medium">
                        {language === 'en' ? p.specEn : p.specAr}
                      </p>

                      {/* Stock Badge */}
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

                {/* Price & Action Row */}
                <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-outline-variant/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                      {language === 'en' ? 'Price' : 'السعر'}
                    </span>
                    <div className="text-right">
                      <span className="text-base font-black text-primary-container block">
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
                      className="px-2.5 py-1.5 bg-surface-container-highest hover:bg-surface-container-high border border-outline-variant/40 text-on-surface rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                      title={t.btn_add_cart}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-primary-container" />
                      <span>{language === 'en' ? 'Add' : 'سلة'}</span>
                    </button>

                    <button 
                      onClick={() => onDirectBuy ? onDirectBuy(p) : onAddToCart(p)}
                      className="px-2.5 py-1.5 bg-primary-container hover:bg-primary-container/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-primary-container/20 active:scale-95"
                      title={language === 'en' ? 'Direct Buy' : 'شراء مباشر'}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{language === 'en' ? 'Direct' : 'مباشر'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 px-6 bg-surface-container rounded-3xl border border-dashed border-outline-variant/40 text-center space-y-3">
            <h3 className="text-xl font-bold text-on-surface">
              {language === 'ar' ? 'المتجر جاهز للتسليم (0 منتجات حالياً)' : 'Store Ready for Handover (No Products Currently)'}
            </h3>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto">
              {language === 'ar'
                ? 'تم تصفير جميع المنتجات التجريبية بنجاح. يمكنك الدخول إلى لوحة التحكم وإضافة الأجهزة الحقيقية الخاصة بالمحل في أي وقت.'
                : 'All sample products have been cleared. Access the Master Operations Dashboard to add real inventory anytime.'}
            </p>
            <button
              onClick={() => setScreen('dashboard')}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container font-bold rounded-xl text-xs hover:scale-105 transition-transform cursor-pointer"
            >
              <span>{language === 'ar' ? 'فتح لوحة التحكم لإضافة منتجات' : 'Open Dashboard to Add Products'}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
