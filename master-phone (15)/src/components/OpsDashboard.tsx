import { useState, FormEvent, ChangeEvent } from 'react';
import { Language, Currency, RepairTicket, InventoryAlert, Product, Order, RepairServiceItem } from '../types';
import { translations } from '../data/translations';
import { wilayas } from '../data/wilayas';
import { defaultRepairServices } from '../data/repairServices';
import { 
  Activity, DollarSign, AlertTriangle, User, Play, ChevronRight, CheckCircle2, 
  RotateCw, PlusCircle, Wrench, Smartphone, Sparkles, Sliders, Check, 
  Trash2, Edit3, ShoppingBag, ListPlus, ShieldCheck, Tag, Layers, RefreshCw,
  Lock, Eye, EyeOff, Facebook, Instagram, Upload, Camera, Image as ImageIcon, X, Printer
} from 'lucide-react';
import DeliverySlipModal from './DeliverySlipModal';

interface OpsDashboardProps {
  language: Language;
  currency: Currency;
  tickets: RepairTicket[];
  onChangeTicketStatus: (id: string, newStatus: 'diagnostic' | 'waiting' | 'completed') => void;
  onDeleteTicket?: (id: string) => void;
  onRestockPart: (id: string) => void;
  inventoryAlerts: InventoryAlert[];
  // Stateful products and orders
  productsList: Product[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  orders: Order[];
  onChangeOrderStatus: (id: string, newStatus: 'pending' | 'shipped' | 'delivered') => void;
  onDeleteOrder?: (id: string) => void;
  // Dynamic RIP and phones control
  ripNumber: string;
  setRipNumber: (rip: string) => void;
  contactPhones: string[];
  setContactPhones: (phones: string[]) => void;
  socialLinks: { instagram: string; tiktok: string; facebook: string };
  setSocialLinks: (links: { instagram: string; tiktok: string; facebook: string }) => void;
  salesBaseline: number;
  onResetMetrics: () => void;
  onRestoreDemoMetrics: () => void;
  onClearProducts?: () => void;
  onRestoreDefaultProducts?: () => void;
  onZeroAllDataAndProducts?: () => void;
  // Repair Services & Prices control
  repairServices?: RepairServiceItem[];
  onUpdateRepairService?: (service: RepairServiceItem) => void;
  onAddRepairService?: (service: RepairServiceItem) => void;
  onDeleteRepairService?: (id: string) => void;
  onRestoreDefaultRepairServices?: () => void;
}

export default function OpsDashboard({
  language,
  currency,
  tickets,
  onChangeTicketStatus,
  onDeleteTicket,
  onRestockPart,
  inventoryAlerts,
  productsList,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  orders,
  onChangeOrderStatus,
  onDeleteOrder,
  ripNumber,
  setRipNumber,
  contactPhones,
  setContactPhones,
  socialLinks,
  setSocialLinks,
  salesBaseline,
  onResetMetrics,
  onRestoreDemoMetrics,
  onClearProducts,
  onRestoreDefaultProducts,
  onZeroAllDataAndProducts,
  repairServices = defaultRepairServices,
  onUpdateRepairService,
  onAddRepairService,
  onDeleteRepairService,
  onRestoreDefaultRepairServices,
}: OpsDashboardProps) {
  const t = translations[language];

  // Tab state for the main dashboard: 'stats' | 'products' | 'orders' | 'repairs' | 'settings'
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders' | 'repairs' | 'settings'>('stats');

  // Delivery Slip Modal state
  const [selectedSlipOrder, setSelectedSlipOrder] = useState<Order | null>(null);
  const [viewReceiptOrder, setViewReceiptOrder] = useState<Order | null>(null);

  // Master Settings tab state
  const [tempRip, setTempRip] = useState(ripNumber);
  const [ripFeedback, setRipFeedback] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [editingPhoneIndex, setEditingPhoneIndex] = useState<number | null>(null);
  const [phoneFeedback, setPhoneFeedback] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Confirmation Modal state for iframe compatibility (avoids blocked window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Social Links state inside Settings tab
  const [tempFb, setTempFb] = useState(socialLinks?.facebook || '');
  const [tempIg, setTempIg] = useState(socialLinks?.instagram || '');
  const [tempTiktok, setTempTiktok] = useState(socialLinks?.tiktok || '');
  const [socialFeedback, setSocialFeedback] = useState('');
  const [resetFeedback, setResetFeedback] = useState('');

  // Repair Services editing state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editPriceUsd, setEditPriceUsd] = useState<number>(0);
  const [editNameAr, setEditNameAr] = useState<string>('');
  const [editNameEn, setEditNameEn] = useState<string>('');
  const [editDescAr, setEditDescAr] = useState<string>('');
  const [editDescEn, setEditDescEn] = useState<string>('');
  const [repairServiceFeedback, setRepairServiceFeedback] = useState<string>('');

  // Add new service modal state
  const [showAddServiceModal, setShowAddServiceModal] = useState<boolean>(false);
  const [newSrvNameAr, setNewSrvNameAr] = useState<string>('');
  const [newSrvNameEn, setNewSrvNameEn] = useState<string>('');
  const [newSrvDescAr, setNewSrvDescAr] = useState<string>('');
  const [newSrvDescEn, setNewSrvDescEn] = useState<string>('');
  const [newSrvPriceUsd, setNewSrvPriceUsd] = useState<number>(50);

  const startEditService = (srv: RepairServiceItem) => {
    setEditingServiceId(srv.id);
    setEditPriceUsd(srv.priceUsd);
    setEditNameAr(srv.nameAr);
    setEditNameEn(srv.nameEn);
    setEditDescAr(srv.descAr);
    setEditDescEn(srv.descEn);
  };

  const handleSaveServiceEdit = (srv: RepairServiceItem) => {
    if (onUpdateRepairService) {
      onUpdateRepairService({
        ...srv,
        nameAr: editNameAr.trim() || srv.nameAr,
        nameEn: editNameEn.trim() || srv.nameEn,
        descAr: editDescAr.trim() || srv.descAr,
        descEn: editDescEn.trim() || srv.descEn,
        priceUsd: Number(editPriceUsd) || srv.priceUsd,
      });
      setRepairServiceFeedback(language === 'ar' ? `تم تحديث سعر ${editNameAr || srv.nameAr} بنجاح!` : `Updated ${srv.nameEn} price successfully!`);
      setTimeout(() => setRepairServiceFeedback(''), 3500);
    }
    setEditingServiceId(null);
  };

  const handleCreateNewService = (e: FormEvent) => {
    e.preventDefault();
    if (!newSrvNameAr.trim() && !newSrvNameEn.trim()) return;
    if (onAddRepairService) {
      onAddRepairService({
        id: `srv_${Date.now()}`,
        nameAr: newSrvNameAr.trim() || 'خدمة صيانة مخصصة',
        nameEn: newSrvNameEn.trim() || 'Custom Repair Service',
        descAr: newSrvDescAr.trim() || 'فحص وصيانة حسب الطلب',
        descEn: newSrvDescEn.trim() || 'Custom diagnostic and repair',
        priceUsd: Number(newSrvPriceUsd) || 50,
        iconName: 'Wrench',
      });
      setRepairServiceFeedback(language === 'ar' ? 'تمت إضافة خدمة التصليح الجديدة بنجاح!' : 'New repair service added successfully!');
      setTimeout(() => setRepairServiceFeedback(''), 3500);
    }
    setShowAddServiceModal(false);
    setNewSrvNameAr('');
    setNewSrvNameEn('');
    setNewSrvDescAr('');
    setNewSrvDescEn('');
    setNewSrvPriceUsd(50);
  };

  const handleUpdateSocials = () => {
    setSocialLinks({
      facebook: tempFb.trim(),
      instagram: tempIg.trim(),
      tiktok: tempTiktok.trim(),
    });
    setSocialFeedback(language === 'ar' ? 'تم تحديث روابط التواصل الاجتماعي بنجاح!' : 'Social media links updated successfully!');
    setTimeout(() => setSocialFeedback(''), 3000);
  };

  const handleUpdateRip = () => {
    if (!tempRip.trim()) {
      alert(language === 'ar' ? 'لا يمكن ترك رقم الـ RIP فارغاً' : 'RIP number cannot be empty');
      return;
    }
    setRipNumber(tempRip.trim());
    setRipFeedback(language === 'ar' ? 'تم تحديث رقم الـ RIP بنجاح!' : 'Baridimob RIP updated successfully!');
    setTimeout(() => setRipFeedback(''), 3000);
  };

  const handleSavePhone = () => {
    if (!tempPhone.trim()) {
      setPhoneError(language === 'ar' ? 'يرجى إدخال رقم الهاتف' : 'Please enter a phone number');
      return;
    }
    setPhoneError('');

    if (editingPhoneIndex !== null) {
      const updated = [...contactPhones];
      updated[editingPhoneIndex] = tempPhone.trim();
      setContactPhones(updated);
      setEditingPhoneIndex(null);
      setPhoneFeedback(language === 'ar' ? 'تم تعديل رقم الهاتف بنجاح!' : 'Phone number updated successfully!');
    } else {
      setContactPhones([...contactPhones, tempPhone.trim()]);
      setPhoneFeedback(language === 'ar' ? 'تم إضافة رقم الهاتف بنجاح!' : 'Phone number added successfully!');
    }

    setTempPhone('');
    setTimeout(() => setPhoneFeedback(''), 3000);
  };

  const handleDeletePhone = (index: number) => {
    askConfirmation(
      language === 'ar' ? 'حذف رقم الهاتف' : 'Delete Phone Number',
      language === 'ar' ? 'هل أنت متأكد من حذف هذا الرقم؟' : 'Are you sure you want to delete this number?',
      () => {
        const updated = contactPhones.filter((_, idx) => idx !== index);
        setContactPhones(updated);
        if (editingPhoneIndex === index) {
          setEditingPhoneIndex(null);
          setTempPhone('');
        }
      }
    );
  };

  // Selected tab in repair queue
  const [activeQueueTab, setActiveQueueTab] = useState<string>('ALL');

  // Product CRUD state
  const [isEditingProduct, setIsEditingProduct] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  // Product Form states
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'smartphones' | 'refurbished' | 'parts' | 'tools'>('smartphones');
  const [prodBrand, setProdBrand] = useState<'Apple' | 'Samsung' | 'Google' | 'Other'>('Other');
  const [prodCondition, setProdCondition] = useState<'New' | 'Refurbished' | 'Certified A+' | 'Pre-Owned' | 'OEM Quality' | 'Pro Toolset' | 'High Cap'>('New');
  const [prodStorage, setProdStorage] = useState('128GB');
  const [prodColor, setProdColor] = useState('Black');
  const [prodDescription, setProdDescription] = useState('');
  const [prodSpecEn, setProdSpecEn] = useState('');
  const [prodSpecAr, setProdSpecAr] = useState('');
  const [prodPriceUsd, setProdPriceUsd] = useState(65000);
  const [prodStockQuantity, setProdStockQuantity] = useState<number>(10);
  const [prodDiscountPercent, setProdDiscountPercent] = useState<number>(0);
  const [prodImage, setProdImage] = useState('');
  const [prodImagesList, setProdImagesList] = useState<string[]>([]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [prodWarrantyMonths, setProdWarrantyMonths] = useState<number>(12);

  // Filter repair queue
  const filteredTickets = tickets.filter((tkt) => {
    if (activeQueueTab === 'ALL') return true;
    if (activeQueueTab === 'DIAGNOSTIC') return tkt.status === 'diagnostic';
    if (activeQueueTab === 'PARTS') return tkt.status === 'waiting';
    return false;
  });

  const exchangeRate = 220; // 1 USD = 220 DZD

  const formatPrice = (usdAmount: number) => {
    return `${Math.round(usdAmount * exchangeRate).toLocaleString()} ${language === 'en' ? 'DZD' : 'د.ج'}`;
  };

  // Status cycling for repair tickets
  const cycleStatus = (id: string, current: string) => {
    let next: 'diagnostic' | 'waiting' | 'completed' = 'diagnostic';
    if (current === 'diagnostic') next = 'waiting';
    else if (current === 'waiting') next = 'completed';
    else if (current === 'completed') next = 'diagnostic';
    onChangeTicketStatus(id, next);
  };

  const getWilayaName = (code: string) => {
    const found = wilayas.find(w => w.code === code);
    if (!found) return code;
    return language === 'en' ? found.nameEn : found.nameAr;
  };

  // Helper to resize single image file to dataUrl
  const resizeImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle Image File Upload from Phone (Android / iPhone) - Multiple Files Supported
  const handleImageFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const fileList = Array.from(files) as File[];
      const dataUrls = await Promise.all(fileList.map((f: File) => resizeImageFile(f)));

      if (dataUrls.length > 0) {
        let currentPrimary = prodImage;
        let galleryList = [...prodImagesList];

        let newUploads = [...dataUrls];
        if (!currentPrimary) {
          currentPrimary = newUploads.shift() || '';
          setProdImage(currentPrimary);
        }

        if (newUploads.length > 0) {
          galleryList = [...galleryList, ...newUploads];
        }
        setProdImagesList(galleryList);
      }
    } catch (err) {
      console.error('Image processing error:', err);
    }

    // Reset file input value
    e.target.value = '';
  };

  const handleAddCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    if (!prodImage) {
      setProdImage(url);
    } else {
      setProdImagesList(prev => [...prev, url]);
    }
    setCustomUrlInput('');
  };

  // Handle Product Save (Add/Edit)
  const handleSaveProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      alert(language === 'ar' ? 'يرجى إدخال اسم المنتج على الأقل!' : 'Please enter a product name!');
      return;
    }

    const finalSpecEn = prodSpecEn.trim() || prodSpecAr.trim() || 'High Quality Specification';
    const finalSpecAr = prodSpecAr.trim() || prodSpecEn.trim() || 'مواصفات ممتازة أصلية';

    const defaultImages = {
      smartphones: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMnB6OIbC6bOlwiYfurQBrwHBKQ2P6D5rqGp0uK3PcvoA_FqTSuv15M7z7M4Rkp1-u6GgxdT-HC1VfG_dPP2NqpwI2jEZvLR3MXTxk3XlAuxNbzMKl4ot8CCJVfVyhuO3oRr50c-L2BYA-QIsq12xf2WyhLH7292AjmaISvKGorMiL-IK5ClSpntyOSCJVdwcI_1WELAM0K-nSSDFAe1tJs7ZGX7JGa_Elrj9qssvRSGJNyFxZb1b6fPEXvBYOAEcAcGzR9CPy0-g',
      refurbished: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgEtabh-LpWXGzgO-HqD7f0JJ0GPV_gRM7UyDWA1qeHykfELrOKtfOpBn0GQnKYijDIDheN3-Qnpaxeo9Ymdd2XbvxnYCjcta1KrRiqtfCHj8h2rYSFqSPeLdwJMDInvY5eig8SqCHhpI7WgesbWk1ElQEp_h6QIpYn8AMteBtTlv4jcU50VAqH_Uj53DRwaWLy2RsPXh_qQblAewDfCPpYn4whdsqfEXUyyfExwRdyA6qlvfJPBSrCxO-Y1ovNIHlrF-rXUXSSgg',
      parts: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbNawfDDizl_nw9Y63GKLwX1vTyX1nSgV-F7kSsNZRuTTcL_mqk4e7MyLMbyICpW6PGLyUQqu-FyWri-rZ6kFzOangTGdjAkVpf4ZYjaom_qSzAUPDn0mA5uWvyU2YXdRDJgh0ETLsHcByfeV5arnyk2ZZ4nGzAMjvf8G_QnX7BOc43Wesc0DpFYvGdjHyB_-ywU9l0BCXDkNFRbuZWyGUeavPH3nziRkLkvTvatAHPx2PbghsFQLcj_6pyE5OT5TDkSZbryUD4tY',
      tools: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp0a49iDeISrhssXF0YQNXJPVhoEzdREv5xYk9TEN17jfSSRcOFTObkcYiDNjZTGyAODoBjCKyVx8rNJ60cPA7leJbqiWfqQ4B0VRQDtRPBenaEalekidZ-CQpn6xOFlYNLMGhcjhMOqbZJIYK4_jYF6wB2Lw1y3zvIlmNgM3pS7M7_j3yzq4bWg7wB4W8dEeSJxHMAPjH9lRsYzCgS7K4oVqfdX0gSP6Cc3NoHpp71b_eG-TinqBxJ2pAvNilRo33XsPYUQkBfpc'
    };

    const imageUrl = prodImage.trim() || defaultImages[prodCategory];
    const additionalImagesArray = prodImagesList.map(s => s.trim()).filter(Boolean);
    const nowTimestamp = new Date().toISOString();

    const productPayload: Product = {
      id: isEditingProduct && editingProductId ? editingProductId : `p-${Date.now()}`,
      name: prodName.trim(),
      price: prodPriceUsd,
      priceUsd: prodPriceUsd / exchangeRate,
      image: imageUrl,
      images: additionalImagesArray.length > 0 ? additionalImagesArray : [imageUrl],
      brand: prodBrand,
      storage: prodStorage.trim() || '128GB',
      color: prodColor.trim() || 'Black',
      condition: prodCondition,
      stock: prodStockQuantity,
      stockQuantity: prodStockQuantity,
      description: prodDescription.trim() || finalSpecAr || finalSpecEn,
      createdAt: nowTimestamp,
      category: prodCategory,
      specEn: finalSpecEn,
      specAr: finalSpecAr,
      rating: 4.8,
      warrantyMonths: prodWarrantyMonths,
      discountPercent: prodDiscountPercent,
    };

    if (isEditingProduct && editingProductId) {
      onUpdateProduct(productPayload);
      setIsEditingProduct(false);
      setEditingProductId(null);
      alert(language === 'ar' ? `تم تحديث المنتج (${prodName}) بنجاح! الكمية: ${prodStockQuantity} حبة` : `Product updated successfully!`);
    } else {
      onAddProduct(productPayload);
      alert(language === 'ar' ? `تمت إضافة المنتج (${prodName}) للمحل بنجاح! الكمية: ${prodStockQuantity} حبة` : `Product added to store catalog successfully!`);
    }

    // Reset Form
    setProdName('');
    setProdSpecEn('');
    setProdSpecAr('');
    setProdPriceUsd(65000);
    setProdStockQuantity(10);
    setProdDiscountPercent(0);
    setProdStorage('128GB');
    setProdColor('Black');
    setProdDescription('');
    setProdImage('');
    setProdImagesList([]);
    setCustomUrlInput('');
    setProdWarrantyMonths(12);
  };

  const handleStartEdit = (p: Product) => {
    setIsEditingProduct(true);
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdBrand(p.brand);
    setProdCondition(p.condition);
    setProdStorage(p.storage || '128GB');
    setProdColor(p.color || 'Black');
    setProdDescription(p.description || p.specAr || p.specEn || '');
    setProdSpecEn(p.specEn);
    setProdSpecAr(p.specAr);
    setProdPriceUsd(p.price ? Math.round(p.price) : Math.round(p.priceUsd * exchangeRate));
    setProdStockQuantity(p.stockQuantity ?? p.stock ?? 10);
    setProdDiscountPercent(p.discountPercent !== undefined ? p.discountPercent : 0);
    setProdImage(p.image || '');
    setProdImagesList(p.images ? [...p.images] : []);
    setCustomUrlInput('');
    setProdWarrantyMonths(p.warrantyMonths !== undefined ? p.warrantyMonths : 12);
    // Smooth scroll to form
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const totalRevenue = orders.reduce((sum, o) => o.status === 'delivered' ? sum + o.totalUsd : sum, 0) + salesBaseline;

  // Password protection state
  const [passwordInput, setPasswordInput] = useState('');
  const [masterPassword, setMasterPassword] = useState<string>(() => {
    return localStorage.getItem('mp_admin_password') || 'DZ-Master-2026';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('mp_admin_authenticated') === 'true';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeFeedback, setPasswordChangeFeedback] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [showChangePasswords, setShowChangePasswords] = useState(false);

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === masterPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('mp_admin_authenticated', 'true');
      setPasswordError('');
    } else {
      setPasswordError(language === 'ar' ? 'كلمة المرور غير صحيحة!' : 'Incorrect password!');
    }
  };

  const handleChangeMasterPassword = (e: FormEvent) => {
    e.preventDefault();
    if (currentPassword !== masterPassword) {
      setPasswordChangeError(language === 'ar' ? 'كلمة المرور الحالية غير صحيحة!' : 'Current password is incorrect!');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setPasswordChangeError(language === 'ar' ? 'يجب أن تتكون كلمة المرور الجديدة من 4 أحرف على الأقل!' : 'New password must be at least 4 characters long!');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError(language === 'ar' ? 'كلمتا المرور غير متطابقتين!' : 'New passwords do not match!');
      return;
    }

    localStorage.setItem('mp_admin_password', newPassword);
    setMasterPassword(newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordChangeError('');
    setPasswordChangeFeedback(language === 'ar' ? 'تم تغيير كلمة المرور الماستر بنجاح!' : 'Master password updated successfully!');
    setTimeout(() => setPasswordChangeFeedback(''), 4000);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/30 shadow-2xl relative overflow-hidden text-left">
          
          {/* Accent light/glow */}
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl"></div>
          
          <div className="w-16 h-16 bg-primary-container/10 text-primary-container rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary-container/20">
            <Lock size={32} />
          </div>
          
          <h2 className="text-2xl font-black text-white mb-2 text-center">
            {language === 'ar' ? 'التحقق من الهوية الفائقة' : 'Master Authentication'}
          </h2>
          <p className="text-on-surface-variant text-sm mb-6 text-center">
            {language === 'ar' 
              ? 'يرجى إدخال كلمة المرور الماستر للوصول إلى لوحة الإدارة الشاملة.' 
              : 'Please enter the master password to access the executive portal.'}
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
                className={`w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 text-white outline-none focus:border-primary-container text-sm text-center font-mono ${language === 'ar' ? 'pl-10 pr-4' : 'pr-10 pl-4'}`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-3.5 text-on-surface-variant hover:text-white transition-colors cursor-pointer ${language === 'ar' ? 'left-3' : 'right-3'}`}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {passwordError && (
              <p className="text-red-500 text-xs font-bold text-center animate-pulse">
                ❌ {passwordError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-primary-container hover:bg-primary-container/90 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer shadow shadow-primary-container/20 text-center text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              <span>{language === 'ar' ? 'تأكيد الدخول 🔐' : 'Confirm Access 🔐'}</span>
            </button>
          </form>



        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 text-left">
      
      {/* Dashboard Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <span className="text-xs text-primary-container font-black uppercase tracking-widest font-display flex items-center gap-2">
            <span>لوحة تحكم الإدارة الفائقة 🔐</span>
            <span className="bg-primary-container/20 text-primary-container border border-primary-container/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
              خلفاوي علاء & خلفاوي يونس
            </span>
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-1">
            {language === 'ar' ? 'بوابة الإدارة الشاملة للمحل' : 'Executive Operations Portal'}
          </h1>
          <p className="text-xs text-primary-container font-bold mt-1.5 flex items-center gap-1.5">
            <span>👑</span>
            <span>
              {language === 'ar' 
                ? 'تحية طيبة لأصحاب المحل: خلفاوي علاء وخلفاوي يونس — المتجر جديد تماماً وجاهز للتسليم والاستعمال الفوري!' 
                : 'Salute to Store Owners: Khalfawi Alaa & Khalfawi Younes — The platform is brand new & ready for live operations!'}
            </span>
          </p>
        </div>

        {/* Actions & Live sync */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              askConfirmation(
                language === 'ar' ? 'تصفير المبيعات' : 'Zero Out Metrics',
                language === 'ar' ? 'هل أنت متأكد من تصفير المبيعات والطلبات إلى 0 د.ج؟' : 'Are you sure you want to zero out all sales and orders to 0 DZD?',
                () => {
                  onResetMetrics();
                  setResetFeedback(language === 'ar' ? 'تم تصفير المبيعات والإحصائيات بنجاح (0 د.ج)' : 'Sales and metrics zeroed out successfully (0 DZD)');
                  setTimeout(() => setResetFeedback(''), 4000);
                }
              );
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
            title={language === 'ar' ? 'تصفير المبيعات والبيانات' : 'Zero Out Metrics'}
          >
            <RotateCw size={13} />
            <span>{language === 'ar' ? 'تصفير المبيعات (0 د.ج)' : 'Zero Out Metrics (0 DZD)'}</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest font-mono">
              {language === 'ar' ? 'مزامنة حية نشطة' : 'LIVE CONTEXT SYNC'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-outline-variant/30 pb-4">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-primary-container text-white shadow'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
          }`}
        >
          <Activity size={15} />
          {language === 'ar' ? 'الإحصائيات العامة' : 'KPI & Analytics'}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-primary-container text-white shadow'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
          }`}
        >
          <Smartphone size={15} />
          {language === 'ar' ? 'إدارة المنتجات (CRUD)' : 'Manage Catalog (CRUD)'}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'orders'
              ? 'bg-primary-container text-white shadow'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
          }`}
        >
          <ShoppingBag size={15} />
          {language === 'ar' ? 'طلبات الشراء الواردة' : 'Sales Orders'}
          {orders.filter(o => o.status === 'pending').length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono">
              {orders.filter(o => o.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('repairs')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'repairs'
              ? 'bg-primary-container text-white shadow'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
          }`}
        >
          <Wrench size={15} />
          {language === 'ar' ? 'تذاكر الصيانة والمخزون' : 'Repairs & Inventory'}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-primary-container text-white shadow'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
          }`}
        >
          <Sliders size={15} />
          {language === 'ar' ? 'إعدادات الدفع والتواصل' : 'Master Settings'}
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. ANALYTICS & STATS TAB */}
      {/* ======================================================== */}
      {activeTab === 'stats' && (
        <div className="space-y-8 animate-fade-in">
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 flex justify-between items-center group">
              <div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">{language === 'ar' ? 'إجمالي المبيعات المحققة' : 'Delivered Sales'}</span>
                <h3 className="text-3xl font-black text-white mt-1">{formatPrice(totalRevenue)}</h3>
                {totalRevenue > 0 ? (
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">📈 {language === 'ar' ? 'مبيعات محققة' : 'Delivered Sales'}</span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">✨ {language === 'ar' ? 'متجر جديد (0 د.ج)' : 'Brand new store (0 DZD)'}</span>
                )}
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign size={24} />
              </div>
            </div>

            <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 flex justify-between items-center group">
              <div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">{language === 'ar' ? 'الطلبات القيد المعالجة' : 'Pending Orders'}</span>
                <h3 className="text-3xl font-black text-white mt-1">{orders.filter(o => o.status === 'pending').length} {language === 'ar' ? 'طلبات' : 'Orders'}</h3>
                <span className="text-[10px] text-primary-container font-bold block mt-1">
                  {orders.filter(o => o.status === 'pending').length > 0 
                    ? (language === 'ar' ? 'تطلب مراجعة وشحن' : 'Requires verification') 
                    : (language === 'ar' ? 'لا توجد طلبات جارية' : 'No pending orders')}
                </span>
              </div>
              <div className="w-12 h-12 bg-primary-container/10 text-primary-container rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag size={24} />
              </div>
            </div>

            <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 flex justify-between items-center group">
              <div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">{language === 'ar' ? 'أجهزة الصيانة النشطة' : 'Active Repairs'}</span>
                <h3 className="text-3xl font-black text-white mt-1">{tickets.filter(t => t.status !== 'completed').length} {language === 'ar' ? 'أجهزة' : 'Devices'}</h3>
                <span className="text-[10px] text-blue-400 font-bold block mt-1">
                  {tickets.filter(t => t.status !== 'completed').length > 0 
                    ? (language === 'ar' ? '⚙️ في ورشات العمل' : 'In active lab work') 
                    : (language === 'ar' ? 'لا توجد أجهزة قيد الصيانة' : 'No active repairs')}
                </span>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench size={24} />
              </div>
            </div>

            <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 flex justify-between items-center group">
              <div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">{language === 'ar' ? 'قطع الغيار الحرجة' : 'Low Stock Alerts'}</span>
                <h3 className="text-3xl font-black text-white mt-1">{inventoryAlerts.filter(a => a.stock <= a.criticalLimit).length} {language === 'ar' ? 'عناصر' : 'Parts'}</h3>
                <span className="text-[10px] text-amber-500 font-bold block mt-1">
                  {inventoryAlerts.filter(a => a.stock <= a.criticalLimit).length > 0 
                    ? (language === 'ar' ? '⚠️ تحتاج إعادة تزويد' : 'Needs restock') 
                    : (language === 'ar' ? 'المخزون ممتاز' : 'Inventory optimal')}
                </span>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart */}
            <div className="lg:col-span-2 bg-surface-container border border-outline-variant/30 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity size={18} className="text-primary-container" />
                {language === 'ar' ? 'أكثر الأجهزة إصلاحاً في الورشة' : 'Most Serviced Smartphone Models'}
              </h3>
              {tickets.length > 0 ? (
                <div className="space-y-4 pt-4">
                  {[
                    { name: 'iPhone 15 / 15 Pro Max', repaired: tickets.filter(t => t.device.includes('iPhone')).length || 1, color: '#ff6600', pct: 90 },
                    { name: 'Samsung Galaxy S24 / S23 Ultra', repaired: tickets.filter(t => t.device.includes('Galaxy') || t.device.includes('Samsung')).length || 1, color: '#3b82f6', pct: 72 },
                    { name: 'Google Pixel 8 / 8 Pro', repaired: tickets.filter(t => t.device.includes('Pixel')).length || 1, color: '#10b981', pct: 56 },
                  ].map((d, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-on-surface-variant">{d.name}</span>
                        <span className="font-mono font-bold text-white">{d.repaired} {language === 'ar' ? 'عملية إصلاح' : 'units'}</span>
                      </div>
                      <div className="w-full h-3.5 bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant/10">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 shadow-lg"
                          style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-surface-container-lowest/50 rounded-xl border border-dashed border-outline-variant/30 space-y-2">
                  <Wrench className="w-8 h-8 text-on-surface-variant mx-auto opacity-50" />
                  <p className="text-xs text-on-surface-variant font-bold">
                    {language === 'ar' ? 'متجر جديد تماماً - لا توجد عمليات صيانة مسجلة بعد' : 'Brand new store - No repair records logged yet'}
                  </p>
                  <p className="text-[11px] text-on-surface-variant/70">
                    {language === 'ar' ? 'ستظهر إحصائيات الأجهزة الأكثر إصلاحاً فور حجز الزبائن لخدمات الصيانة.' : 'Repair statistics will populate automatically as clients submit repair tickets.'}
                  </p>
                </div>
              )}
            </div>

            {/* Wilayas Stats */}
            <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-primary-container" />
                {language === 'ar' ? 'توزيع الطلبيات بالولايات الأكثر نشاطاً' : 'Most Active Shipping Wilayas'}
              </h3>
              {orders.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {[
                    { nameEn: 'Algiers', nameAr: 'الجزائر', count: orders.filter(o => o.wilayaCode === '16').length || 1, pct: 100 },
                    { nameEn: 'Oran', nameAr: 'وهران', count: orders.filter(o => o.wilayaCode === '31').length || 1, pct: 67 },
                    { nameEn: 'Constantine', nameAr: 'قسنطينة', count: orders.filter(o => o.wilayaCode === '25').length || 1, pct: 50 },
                  ].map((w, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-outline-variant/15 last:border-none">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary-container/10 text-primary-container font-bold text-xs rounded-lg flex items-center justify-center font-mono">#{i+1}</span>
                        <span className="text-sm font-semibold text-white">{language === 'ar' ? w.nameAr : w.nameEn}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant font-mono font-bold">{w.count} {language === 'ar' ? 'طلب شحن' : 'orders'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-surface-container-lowest/50 rounded-xl border border-dashed border-outline-variant/30 space-y-2">
                  <ShoppingBag className="w-8 h-8 text-on-surface-variant mx-auto opacity-50" />
                  <p className="text-xs text-on-surface-variant font-bold">
                    {language === 'ar' ? 'متجر جديد تماماً - لا توجد طلبات شحن مسجلة بعد' : 'Brand new store - No shipping orders logged yet'}
                  </p>
                  <p className="text-[11px] text-on-surface-variant/70">
                    {language === 'ar' ? 'ستظهر قائمة الولايات الأكثر طلباً تلقائياً عند قيام الزبائن بشراء الهواتف.' : 'Wilaya order volume will populate automatically as customer purchases come in.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PRODUCT CRUD TAB (ADD, EDIT, DELETE) */}
      {/* ======================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-8 animate-fade-in">
          {/* Add / Edit Form Panel */}
          <div className="glass-card p-6 rounded-2xl border border-outline-variant/30">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-outline-variant/20 pb-3">
              <ListPlus size={18} className="text-primary-container" />
              {isEditingProduct 
                ? (language === 'ar' ? 'تعديل معلومات المنتج الحالي' : 'Edit Selected Product') 
                : (language === 'ar' ? 'إضافة جهاز أو قطعة جديدة للمحل' : 'Add New Device or Hardware Part')}
            </h3>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-4">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'اسم المنتج *' : 'Product Name *'}</label>
                <input 
                  type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g., iPhone 15 Pro Max, Screen Repair Kit"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'التصنيف *' : 'Category *'}</label>
                <select 
                  value={prodCategory} onChange={(e: any) => setProdCategory(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container text-sm"
                >
                  <option value="smartphones">{language === 'ar' ? 'هواتف ذكية' : 'Smartphones'}</option>
                  <option value="refurbished">{language === 'ar' ? 'مجدد مضمون' : 'Refurbished'}</option>
                  <option value="parts">{language === 'ar' ? 'قطع غيار' : 'Parts'}</option>
                  <option value="tools">{language === 'ar' ? 'أدوات صيانة' : 'Tools'}</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'الماركة *' : 'Brand *'}</label>
                <select 
                  value={prodBrand} onChange={(e: any) => setProdBrand(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container text-sm"
                >
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Google">Google</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'الحالة أو الجودة *' : 'Condition/Quality *'}</label>
                <select 
                  value={prodCondition} onChange={(e: any) => setProdCondition(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container text-sm"
                >
                  <option value="New">New / جديد</option>
                  <option value="Refurbished">Refurbished / مجدد</option>
                  <option value="Certified A+">Certified A+ / درجة أولى</option>
                  <option value="Pre-Owned">Pre-Owned / مستعمل نظيف</option>
                  <option value="OEM Quality">OEM Quality / جودة أصلية</option>
                  <option value="Pro Toolset">Pro Toolset / طقم احترافي</option>
                  <option value="High Cap">High Cap / قدرة عالية</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'السعر النهائي (د.ج) *' : 'Final Price (DZD) *'}</label>
                <input 
                  type="number" required min={1} value={prodPriceUsd} onChange={(e) => setProdPriceUsd(Number(e.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container font-mono text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'عدد الحبات المتوفرة *' : 'Stock Quantity *'}</label>
                <input 
                  type="number" required min={0} value={prodStockQuantity} onChange={(e) => setProdStockQuantity(Math.max(0, Number(e.target.value)))}
                  placeholder="10"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container font-mono text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'نسبة الخصم (%)' : 'Discount (%)'}</label>
                <input 
                  type="number" min={0} max={90} value={prodDiscountPercent} onChange={(e) => setProdDiscountPercent(Math.min(90, Math.max(0, Number(e.target.value))))}
                  placeholder="0"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container font-mono text-sm"
                />
              </div>

              {/* Price & Discount Calculation Live Preview */}
              {prodDiscountPercent > 0 && (
                <div className="md:col-span-12 bg-primary-container/10 border border-primary-container/30 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                      -{prodDiscountPercent}% {language === 'ar' ? 'خصم' : 'OFF'}
                    </span>
                    <span className="text-on-surface-variant">
                      {language === 'ar' ? 'السعر الأصلي قبل الخصم:' : 'Original Price:'}{' '}
                      <span className="line-through font-bold text-red-400">
                        {Math.round((prodPriceUsd / (1 - prodDiscountPercent / 100))).toLocaleString()} د.ج
                      </span>
                    </span>
                  </div>
                  <div className="text-emerald-400 font-bold">
                    {language === 'ar' ? 'مجموع توفير الزبون:' : 'Customer Saves:'}{' '}
                    {(Math.round(prodPriceUsd / (1 - prodDiscountPercent / 100)) - prodPriceUsd).toLocaleString()} د.ج
                  </div>
                </div>
              )}

              <div className="md:col-span-3">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'السعة / التخزين *' : 'Storage *'}</label>
                <input 
                  type="text" value={prodStorage} onChange={(e) => setProdStorage(e.target.value)}
                  placeholder="e.g., 128GB, 256GB, 512GB"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'اللون *' : 'Color *'}</label>
                <input 
                  type="text" value={prodColor} onChange={(e) => setProdColor(e.target.value)}
                  placeholder="e.g., Space Black, Titanium Gray"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container text-sm"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'وصف للمنتج *' : 'Description *'}</label>
                <input 
                  type="text" value={prodDescription} onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="e.g., Original flagship device in mint condition"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container text-sm"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'المواصفات (بالإنجليزية) *' : 'Specifications (English) *'}</label>
                <input 
                  type="text" required value={prodSpecEn} onChange={(e) => setProdSpecEn(e.target.value)}
                  placeholder="e.g., 256GB | Space Gray | Unlocked"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container text-sm"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'المواصفات (بالعربية) *' : 'Specifications (Arabic) *'}</label>
                <input 
                  type="text" required value={prodSpecAr} onChange={(e) => setProdSpecAr(e.target.value)}
                  placeholder="مثال: 256 جيجابايت | رمادي فلكي | مفتوح لكل الشبكات"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container text-sm text-right"
                />
              </div>

              {/* Phone Image Upload Section */}
              <div className="md:col-span-12 bg-surface-container-lowest/80 border border-outline-variant/40 p-4 rounded-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs text-white font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Camera size={15} className="text-primary-container" />
                      <span>{language === 'ar' ? 'رفع صور متعددة مباشرة من الهاتف (أندرويد / آيفون)' : 'Upload Multiple Photos directly from Phone'}</span>
                    </label>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {language === 'ar' 
                        ? 'اختر أي عدد من الصور من المعرض أو التقط بالكاميرا مباشرة' 
                        : 'Select any number of photos from your gallery or take new pictures'}
                    </p>
                  </div>

                  <label className="bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 active:scale-95 shadow-md">
                    <Upload size={16} />
                    <span>{language === 'ar' ? '📷 اختيار/إضافة صور' : '📷 Select / Add Photos'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleImageFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Add Image by URL option */}
                <div className="pt-2 border-t border-outline-variant/20 flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <input 
                      type="text" 
                      value={customUrlInput} 
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder={language === 'ar' ? 'أو أدخل رابط صورة من الإنترنت (https://...)' : 'Or paste an image web URL (https://...)'}
                      className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-container font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomUrl}
                    className="bg-surface-container-highest hover:bg-primary-container hover:text-white text-on-surface text-xs font-bold px-3 py-2 rounded-xl border border-outline-variant transition-colors"
                  >
                    {language === 'ar' ? '+ إضافة الرابط' : '+ Add URL'}
                  </button>
                </div>

                {/* Preview Thumbnails for Primary & Additional Images */}
                {(prodImage || prodImagesList.length > 0) && (
                  <div className="pt-3 border-t border-outline-variant/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                        <ImageIcon size={14} />
                        <span>
                          {language === 'ar' 
                            ? `الصور المضافة للمنتج (${(prodImage ? 1 : 0) + prodImagesList.length} صور):` 
                            : `Added Photos (${(prodImage ? 1 : 0) + prodImagesList.length} total):`}
                        </span>
                      </span>
                      <span className="text-[10px] text-on-surface-variant italic">
                        {language === 'ar' ? 'انقر على X لإزالة أي صورة' : 'Click X to remove any photo'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {/* Primary Image Thumbnail */}
                      {prodImage && (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-primary-container bg-surface-container-high flex-shrink-0 group shadow-md">
                          <img src={prodImage} alt="Primary" className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 left-0 right-0 bg-primary-container/90 text-[9px] text-white font-bold text-center py-0.5">
                            {language === 'ar' ? 'الرئيسية' : 'Primary'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (prodImagesList.length > 0) {
                                setProdImage(prodImagesList[0]);
                                setProdImagesList(prodImagesList.slice(1));
                              } else {
                                setProdImage('');
                              }
                            }}
                            className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full p-1 hover:scale-110 transition-transform shadow z-10"
                            title={language === 'ar' ? 'إزالة الصورة الرئيسية' : 'Remove primary image'}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}

                      {/* Additional Gallery Thumbnails */}
                      {prodImagesList.map((imgUrl, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant bg-surface-container-high flex-shrink-0 group shadow-md">
                          <img src={imgUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 left-0 right-0 bg-surface-container-highest/90 text-[9px] text-white text-center py-0.5 font-mono">
                            #{idx + 2}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setProdImagesList(prodImagesList.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full p-1 hover:scale-110 transition-transform shadow z-10"
                            title={language === 'ar' ? 'إزالة هذه الصورة' : 'Remove this photo'}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-8">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'رابط الصورة الرئيسي (معاينة حية)' : 'Primary Image (Live Preview)'}</label>
                <input 
                  type="text" value={prodImage} onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container text-sm font-mono"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs text-on-surface-variant mb-1 font-bold uppercase">{language === 'ar' ? 'مدة الضمان (شهور)' : 'Warranty (Months)'}</label>
                <input 
                  type="number" min={0} value={prodWarrantyMonths} onChange={(e) => setProdWarrantyMonths(Number(e.target.value))}
                  placeholder="12"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-white outline-none focus:border-primary-container text-sm font-mono"
                />
              </div>

              <div className="md:col-span-12 flex justify-end mt-2">
                <button 
                  type="submit"
                  className="bg-primary-container hover:bg-primary-container/90 text-white font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer shadow shadow-primary-container/20 text-center text-sm flex items-center justify-center gap-1.5"
                >
                  <PlusCircle size={16} />
                  {isEditingProduct 
                    ? (language === 'ar' ? 'تحديث وحفظ' : 'Update Product') 
                    : (language === 'ar' ? 'إضافة للمحل' : 'Add to Catalog')}
                </button>
              </div>
            </form>
          </div>

          {/* Catalog Management List */}
          <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-outline-variant/20">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-primary-container" />
                <span>
                  {language === 'ar' ? 'قائمة الهواتف والمنتجات المتوفرة في المتجر حالياً' : 'All Products Currently In Stock'}
                  <span className="ml-2 text-xs font-mono text-primary-container font-semibold">({productsList.length})</span>
                </span>
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    askConfirmation(
                      language === 'ar' ? 'تصفير المنتجات' : 'Clear All Products',
                      language === 'ar' ? 'هل أنت متأكد من تصفير وحذف جميع المنتجات من المتجر؟' : 'Are you sure you want to clear all products from the store?',
                      () => {
                        onClearProducts?.();
                        setResetFeedback(language === 'ar' ? 'تم تصفير قائمة المنتجات بنجاح (0 منتج)' : 'All products zeroed out successfully (0 products)');
                        setTimeout(() => setResetFeedback(''), 4000);
                      }
                    );
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title={language === 'ar' ? 'حذف وتصفير كافة المنتجات' : 'Clear All Products'}
                >
                  <Trash2 size={13} />
                  <span>{language === 'ar' ? 'تصفير المنتجات (0 منتج)' : 'Clear All Products'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onRestoreDefaultProducts?.();
                    setResetFeedback(language === 'ar' ? 'تم استرجاع المنتجات النموذجية بنجاح!' : 'Sample products restored successfully!');
                    setTimeout(() => setResetFeedback(''), 4000);
                  }}
                  className="bg-surface-container-highest hover:bg-surface-container-high text-white border border-outline-variant/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title={language === 'ar' ? 'إعادة المنتجات النموذجية' : 'Restore Sample Products'}
                >
                  <RotateCw size={13} />
                  <span>{language === 'ar' ? 'استرجاع العينات' : 'Restore Samples'}</span>
                </button>
              </div>
            </div>

            {productsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80">
                      <th className="py-3 px-2">{language === 'ar' ? 'صورة' : 'Image'}</th>
                      <th className="py-3 px-2">{language === 'ar' ? 'اسم المنتج' : 'Product Name'}</th>
                      <th className="py-3 px-2">{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                      <th className="py-3 px-2">{language === 'ar' ? 'المخزون (الحبات)' : 'Stock (Units)'}</th>
                      <th className="py-3 px-2">{language === 'ar' ? 'الخصم' : 'Discount'}</th>
                      <th className="py-3 px-2">{language === 'ar' ? 'السعر' : 'Price'}</th>
                      <th className="py-3 px-2 text-right">{language === 'ar' ? 'إجراءات التحكم' : 'Control Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-xs">
                    {productsList.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-container-high/35 transition-colors">
                        <td className="py-3 px-2">
                          <img 
                            src={p.image} alt={p.name} referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-lg bg-surface-container-lowest border border-outline-variant/40"
                          />
                        </td>
                        <td className="py-3 px-2 font-bold text-white">
                          <div>{p.name}</div>
                          <div className="text-[10px] font-normal text-on-surface-variant mt-0.5">{language === 'ar' ? p.specAr : p.specEn}</div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary-container text-[10px] font-bold uppercase">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-mono font-bold inline-flex items-center gap-1 ${
                            (p.stockQuantity ?? 10) === 0 
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                              : (p.stockQuantity ?? 10) <= 3 
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {(p.stockQuantity ?? 10) === 0 
                              ? (language === 'ar' ? 'نفذت الكمية' : 'Out of Stock') 
                              : `${p.stockQuantity ?? 10} ${language === 'ar' ? 'حبة' : 'units'}`}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {p.discountPercent && p.discountPercent > 0 ? (
                            <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 font-bold border border-red-500/30 text-xs inline-flex items-center gap-0.5">
                              -{p.discountPercent}%
                            </span>
                          ) : (
                            <span className="text-on-surface-variant text-[11px] italic">
                              {language === 'ar' ? 'لا يوجد' : 'None'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 font-mono font-bold">
                          <span className="text-emerald-400 block font-bold">{Math.round(p.priceUsd * exchangeRate).toLocaleString()} د.ج</span>
                          {p.discountPercent && p.discountPercent > 0 ? (
                            <span className="text-red-400/80 line-through text-[10px] block">
                              {Math.round((p.priceUsd / (1 - p.discountPercent / 100)) * exchangeRate).toLocaleString()} د.ج
                            </span>
                          ) : (
                            <span className="text-on-surface-variant text-[10px] block">${p.priceUsd}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleStartEdit(p)}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors cursor-pointer"
                              title={language === 'ar' ? 'تعديل' : 'Edit'}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                askConfirmation(
                                  language === 'ar' ? 'حذف المنتج' : 'Delete Product',
                                  language === 'ar' ? `هل أنت متأكد من حذف ${p.name}؟` : `Delete ${p.name}?`,
                                  () => {
                                    onDeleteProduct(p.id);
                                  }
                                );
                              }}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                              title={language === 'ar' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/40 space-y-3">
                <div className="w-12 h-12 bg-primary-container/10 text-primary-container rounded-2xl flex items-center justify-center mx-auto">
                  <Layers size={24} />
                </div>
                <h4 className="text-base font-bold text-white">
                  {language === 'ar' ? 'تم تصفير قائمة المنتجات بالكامل (0 منتج)' : 'Product Catalog Zeroed Out (0 Products)'}
                </h4>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  {language === 'ar'
                    ? 'المتجر جاهز الآن تماماً للتسليم! يمكنك إضافة أجهزتك الحقيقية باستخدام نموذج الإضافة أعلاه في أي وقت.'
                    : 'The store catalog is now completely clear and ready for handover! Use the form above to add your real devices.'}
                </p>
                {onRestoreDefaultProducts && (
                  <button
                    type="button"
                    onClick={onRestoreDefaultProducts}
                    className="mt-2 text-xs text-primary-container hover:underline font-bold"
                  >
                    {language === 'ar' ? 'أو انقر هنا لاسترجاع العينات التجريبية' : 'Or click here to restore sample products'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Slip Modal for Store Owners */}
      {selectedSlipOrder && (
        <DeliverySlipModal
          order={selectedSlipOrder}
          language={language}
          onClose={() => setSelectedSlipOrder(null)}
          contactPhones={contactPhones}
        />
      )}

      {/* Baridimob Receipt Screenshot Modal */}
      {viewReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container border border-outline-variant/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <div>
                <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                  <ImageIcon className="text-primary-container w-5 h-5" />
                  <span>{language === 'ar' ? 'وصل تحويل بريديموب المرفق' : 'Uploaded Baridimob Transfer Receipt'}</span>
                </h3>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                  {viewReceiptOrder.id} • {viewReceiptOrder.customerName} ({viewReceiptOrder.customerPhone})
                </p>
              </div>
              <button
                onClick={() => setViewReceiptOrder(null)}
                className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {viewReceiptOrder.baridimobReceiptUrl ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-black/40 flex justify-center p-2 max-h-[60vh]">
                  <img 
                    src={viewReceiptOrder.baridimobReceiptUrl} 
                    alt="Baridimob Receipt Full" 
                    className="max-h-[55vh] w-auto object-contain rounded-lg shadow-md"
                  />
                </div>
                <div className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-xl text-xs border border-outline-variant/20">
                  <div>
                    <span className="text-on-surface-variant block">{language === 'ar' ? 'المبلغ المطلوب:' : 'Order Total:'}</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">{formatPrice(viewReceiptOrder.totalUsd)}</span>
                  </div>
                  <a
                    href={viewReceiptOrder.baridimobReceiptUrl}
                    download={`Baridimob-Receipt-${viewReceiptOrder.id}.png`}
                    className="px-3.5 py-2 bg-primary-container hover:bg-primary-container/90 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-1.5 shadow-md shadow-primary-container/20"
                  >
                    <Upload className="w-3.5 h-3.5 rotate-180" />
                    <span>{language === 'ar' ? 'تحميل الوصل' : 'Download Image'}</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-on-surface-variant space-y-2">
                <ImageIcon size={40} className="mx-auto text-on-surface-variant/40" />
                <p>{language === 'ar' ? 'لم يقم الزبون بإرفاق صورة الوصل لهذا الطلب.' : 'No receipt screenshot was attached for this order.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SALES ORDERS TAB */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary-container" />
              {language === 'ar' ? 'إدارة طلبيات الشراء والشحن المسجلة' : 'Sales Orders Ledger'}
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag size={48} className="mx-auto text-on-surface-variant/40 mb-3" />
                <p className="text-on-surface-variant">{language === 'ar' ? 'لا توجد أي طلبيات مسجلة حالياً.' : 'No orders recorded yet.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80">
                      <th className="py-3 px-2">{language === 'ar' ? 'الطلب' : 'Order Ref'}</th>
                      <th className="py-3 px-2">{language === 'ar' ? 'الزبون والهاتف' : 'Customer & Contact'}</th>
                      <th className="py-3 px-2">{language === 'ar' ? 'الولاية والعنوان' : 'Shipping Address'}</th>
                      <th className="py-3 px-2">{language === 'ar' ? 'المنتجات المطلوبة' : 'Items Ordered'}</th>
                      <th className="py-3 px-2">{language === 'ar' ? 'المجموع' : 'Total'}</th>
                      <th className="py-3 px-2 text-center">{language === 'ar' ? 'طريقة الدفع' : 'Payment'}</th>
                      <th className="py-3 px-2 text-center">{language === 'ar' ? 'حالة الطلب' : 'Status'}</th>
                      <th className="py-3 px-2 text-right">{language === 'ar' ? 'التحكم' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-xs">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-surface-container-high/35 transition-colors">
                        <td className="py-4 px-2 font-mono font-bold text-primary-container">
                          <div>{order.id}</div>
                          <div className="text-[9px] font-normal text-on-surface-variant font-sans mt-0.5">{order.date}</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="font-bold text-white">{order.customerName}</div>
                          <div className="text-on-surface-variant font-mono text-[10px] mt-0.5">{order.customerPhone}</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="font-semibold text-white">
                            {order.wilayaCode} - {getWilayaName(order.wilayaCode)}
                          </div>
                          <div className="text-on-surface-variant line-clamp-1 max-w-xs">{order.address}</div>
                        </td>
                        <td className="py-4 px-2 max-w-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="text-on-surface font-medium">
                              • {it.productName} <span className="text-primary-container font-bold font-mono">({it.quantity}x)</span>
                            </div>
                          ))}
                        </td>
                        <td className="py-4 px-2 font-mono font-bold text-emerald-400">
                          {formatPrice(order.totalUsd)}
                        </td>
                        <td className="py-4 px-2 text-center">
                          {order.paymentMethod === 'cod' ? (
                            <span className="px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant/30 text-[10px] text-on-surface">
                              {language === 'ar' ? 'عند الاستلام (COD)' : 'COD'}
                            </span>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-2 py-0.5 rounded bg-primary-container/20 border border-primary-container/40 text-[10px] text-primary-container font-bold">
                                Baridimob
                              </span>
                              {order.baridimobReceiptUrl ? (
                                <button
                                  onClick={() => setViewReceiptOrder(order)}
                                  className="px-2 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                                  title={language === 'ar' ? 'معاينة لقطة شاشة وصل بريديموب' : 'View Baridimob Receipt Screenshot'}
                                >
                                  <ImageIcon size={10} />
                                  <span>{language === 'ar' ? 'معاينة الوصل 📷' : 'View Receipt 📷'}</span>
                                </button>
                              ) : (
                                <span className="text-[9px] text-on-surface-variant/60 font-medium">
                                  {language === 'ar' ? 'بدون وصل' : 'No receipt'}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            order.status === 'delivered' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                            order.status === 'shipped' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                            'bg-amber-500/10 text-primary-container border border-primary-container/20'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              order.status === 'delivered' ? 'bg-green-500' :
                              order.status === 'shipped' ? 'bg-blue-500' : 'bg-amber-500'
                            }`} />
                            <span>
                              {order.status === 'delivered' ? (language === 'ar' ? 'تم التوصيل' : 'Delivered') :
                               order.status === 'shipped' ? (language === 'ar' ? 'تم الشحن' : 'Shipped') :
                               (language === 'ar' ? 'معلق' : 'Pending')}
                            </span>
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedSlipOrder(order)}
                              className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all cursor-pointer font-bold text-[9px] flex items-center gap-1"
                              title={language === 'ar' ? 'استخراج وصل التوصيل لشركة الشحن' : 'Print Delivery Voucher Slip'}
                            >
                              <Printer size={12} />
                              <span>{language === 'ar' ? 'وصل التوصيل' : 'Slip'}</span>
                            </button>

                            {order.status === 'pending' && (
                              <button
                                onClick={() => onChangeOrderStatus(order.id, 'shipped')}
                                className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all cursor-pointer font-bold text-[9px]"
                              >
                                {language === 'ar' ? 'شحن الطلب' : 'Ship'}
                              </button>
                            )}
                            {order.status === 'shipped' && (
                              <button
                                onClick={() => onChangeOrderStatus(order.id, 'delivered')}
                                className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all cursor-pointer font-bold text-[9px]"
                              >
                                {language === 'ar' ? 'تم الاستلام' : 'Complete'}
                              </button>
                            )}

                            {onDeleteOrder && (
                              <button
                                onClick={() => {
                                  askConfirmation(
                                    language === 'ar' ? 'حذف الطلبية' : 'Delete Order',
                                    language === 'ar' ? `هل أنت متأكد من حذف الطلبية (${order.id})؟` : `Delete order ${order.id}?`,
                                    () => {
                                      onDeleteOrder(order.id);
                                    }
                                  );
                                }}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                                title={language === 'ar' ? 'حذف الطلبية' : 'Delete order'}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. REPAIR QUEUE & PARTS TAB */}
      {/* ======================================================== */}
      {activeTab === 'repairs' && (
        <div className="space-y-8 animate-fade-in">
          {/* Quick Price Customization Banner */}
          <div className="bg-primary-container/10 border border-primary-container/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary-container shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-white font-extrabold">
                  {language === 'ar' ? '⚙️ خاصية تعديل أسعار التصليح والصيانة' : '⚙️ Manage Repair Services & Price Catalog'}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {language === 'ar' ? 'تعديل أسعار الشاشات، البطاريات، صيانة المياه والتوصيل بكل سهولة بالدينار الجزائري.' : 'Customize prices for screens, battery replacement, water damage, and charging ports in DZD.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2 bg-primary-container hover:bg-primary-container/90 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 shadow flex items-center gap-1.5 active:scale-95"
            >
              <Sliders size={14} />
              <span>{language === 'ar' ? 'تعديل أسعار التصليح الآن' : 'Edit Repair Prices'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Queue */}
            <div className="lg:col-span-8 bg-surface-container border border-outline-variant/30 rounded-2xl overflow-hidden p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-white">
                  {t.dash_queue_title}
                </h2>

                {/* Queue Filter Tabs */}
                <div className="flex gap-1.5 bg-surface-container-highest p-1 rounded-xl border border-outline-variant/20">
                  {['ALL', 'DIAGNOSTIC', 'PARTS'].map((tab) => {
                    const label = tab === 'ALL' ? t.dash_queue_all : tab === 'DIAGNOSTIC' ? t.dash_queue_diagnostic : t.dash_queue_parts;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveQueueTab(tab)}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider cursor-pointer ${
                          activeQueueTab === tab 
                            ? 'bg-primary-container text-white shadow' 
                            : 'text-on-surface-variant hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80">
                      <th className="py-3 px-2">{t.dash_col_id}</th>
                      <th className="py-3 px-2">{t.dash_col_device}</th>
                      <th className="py-3 px-2">{t.dash_col_customer}</th>
                      <th className="py-3 px-2">{language === 'en' ? 'Wilaya' : 'الولاية'}</th>
                      <th className="py-3 px-2 text-center">{t.dash_col_status}</th>
                      <th className="py-3 px-2 text-right">{t.dash_btn_manage}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-xs">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-surface-container-high/35 transition-colors">
                        <td className="py-4 px-2 font-mono font-bold text-primary-container">
                          {ticket.id}
                        </td>
                        <td className="py-4 px-2 font-bold text-white">
                          {ticket.device}
                        </td>
                        <td className="py-4 px-2 text-on-surface-variant font-medium">
                          {ticket.customer}
                        </td>
                        <td className="py-4 px-2 font-semibold text-on-surface-variant">
                          {getWilayaName(ticket.wilayaCode)}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            ticket.status === 'completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                            ticket.status === 'waiting' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                            'bg-orange-500/10 text-primary-container border border-primary-container/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              ticket.status === 'completed' ? 'bg-green-500' :
                              ticket.status === 'waiting' ? 'bg-blue-500' : 'bg-primary-container'
                            }`} />
                            <span>
                              {ticket.status === 'completed' ? t.status_completed :
                               ticket.status === 'waiting' ? t.status_waiting : t.status_diagnostic}
                            </span>
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => cycleStatus(ticket.id, ticket.status)}
                              className="px-2.5 py-1 bg-surface-container-highest border border-outline-variant/60 hover:border-primary-container/40 rounded-lg text-[10px] font-bold uppercase text-white hover:text-primary-container cursor-pointer transition-all active:scale-90"
                            >
                              {language === 'en' ? 'Update' : 'تحديث'}
                            </button>
                            {onDeleteTicket && (
                              <button
                                onClick={() => {
                                  askConfirmation(
                                    language === 'ar' ? 'حذف الجهاز من الصيانة' : 'Delete Repair Device',
                                    language === 'ar' ? `هل أنت متأكد من حذف هذا الجهاز (${ticket.device}) من طابور الصيانة؟` : `Delete ticket for ${ticket.device}?`,
                                    () => {
                                      onDeleteTicket(ticket.id);
                                    }
                                  );
                                }}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                                title={language === 'ar' ? 'حذف الجهاز من القائمة' : 'Delete ticket'}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Alerts */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" />
                  {t.dash_alerts}
                </h3>

                <div className="space-y-3.5">
                  {inventoryAlerts.map((part) => {
                    const isCritical = part.stock <= part.criticalLimit;
                    return (
                      <div 
                        key={part.id}
                        className={`p-3.5 rounded-xl border flex justify-between items-center transition-all ${
                          isCritical 
                            ? 'bg-amber-500/5 border-amber-500/20' 
                            : 'bg-surface-container-highest/50 border-outline-variant/30 opacity-70'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{part.partName}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium mt-1">
                            {t.dash_current_stock}: <span className="font-mono font-bold text-white">{part.stock}</span> {t.dash_units}
                          </p>
                        </div>

                        <button
                          onClick={() => onRestockPart(part.id)}
                          disabled={!isCritical}
                          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            isCritical 
                              ? 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95' 
                              : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/30 cursor-not-allowed'
                          }`}
                        >
                          {isCritical ? t.dash_restock : <Check className="w-3.5 h-3.5 text-green-500" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MASTER SETTINGS TAB (REPAIR PRICES, RIP, PHONE NUMBERS CRUD) */}
      {/* ======================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Repair Services & Prices Editing Card */}
          <div className="bg-surface-container border border-outline-variant/30 p-6 rounded-2xl space-y-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-center text-primary-container shrink-0">
                  <Wrench size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span>{language === 'ar' ? 'تعديل أسعار خدمات التصليح والصيانة' : 'Manage Repair Services & Pricing'}</span>
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                      {repairServices.length} {language === 'ar' ? 'خدمة' : 'services'}
                    </span>
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {language === 'ar' 
                      ? 'تحديث وتعديل أسعار خدمات صيانة الهواتف (تغيير الشاشة، البطارية، الكاميرا، إلخ) بالدينار الجزائري والدولار بسهولة.' 
                      : 'Set custom repair prices for screens, batteries, camera, water damage, and logic board services.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(true)}
                  className="bg-primary-container hover:bg-primary-container/90 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <PlusCircle size={15} />
                  <span>{language === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service'}</span>
                </button>

                {onRestoreDefaultRepairServices && (
                  <button
                    type="button"
                    onClick={() => {
                      askConfirmation(
                        language === 'ar' ? 'إعادة ضبط أسعار الصيانة' : 'Restore Default Pricing',
                        language === 'ar' ? 'هل أنت متأكد من إعادة ضبط أسعار خدمات التصليح إلى الأسعار الافتراضية؟' : 'Restore default repair pricing?',
                        () => {
                          onRestoreDefaultRepairServices();
                          setRepairServiceFeedback(language === 'ar' ? 'تم استرجاع أسعار التصليح الافتراضية بنجاح!' : 'Restored default repair prices!');
                          setTimeout(() => setRepairServiceFeedback(''), 3000);
                        }
                      );
                    }}
                    className="bg-surface-container-highest hover:bg-surface-container-high text-on-surface-variant hover:text-white border border-outline-variant/40 px-3 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                    title={language === 'ar' ? 'استعادة الأسعار الافتراضية' : 'Restore Defaults'}
                  >
                    <RotateCw size={14} />
                    <span className="hidden sm:inline">{language === 'ar' ? 'الافتراضي' : 'Reset'}</span>
                  </button>
                )}
              </div>
            </div>

            {repairServiceFeedback && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 size={16} />
                <span>{repairServiceFeedback}</span>
              </div>
            )}

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repairServices.map((srv) => {
                const isEditing = editingServiceId === srv.id;
                const priceDzdCalculated = Math.round((isEditing ? editPriceUsd : srv.priceUsd) * 220);

                return (
                  <div
                    key={srv.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isEditing
                        ? 'bg-primary-container/10 border-primary-container shadow-md'
                        : 'bg-surface-container-lowest/70 border-outline-variant/30 hover:border-primary-container/40'
                    }`}
                  >
                    {isEditing ? (
                      /* Editing Mode */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-on-surface-variant block mb-1">
                              {language === 'ar' ? 'اسم الخدمة بالعربية' : 'Name (Arabic)'}
                            </label>
                            <input
                              type="text"
                              value={editNameAr}
                              onChange={(e) => setEditNameAr(e.target.value)}
                              className="w-full bg-surface-container border border-outline-variant rounded-lg p-2 text-xs text-white font-bold outline-none focus:border-primary-container"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-on-surface-variant block mb-1">
                              {language === 'ar' ? 'اسم الخدمة بالإنجليزية' : 'Name (English)'}
                            </label>
                            <input
                              type="text"
                              value={editNameEn}
                              onChange={(e) => setEditNameEn(e.target.value)}
                              className="w-full bg-surface-container border border-outline-variant rounded-lg p-2 text-xs text-white font-bold outline-none focus:border-primary-container"
                            />
                          </div>
                        </div>

                        {/* Price Editor (DZD) */}
                        <div className="bg-surface-container/60 p-2.5 rounded-xl border border-outline-variant/20">
                          <label className="text-[10px] font-bold text-emerald-400 block mb-1">
                            {language === 'ar' ? 'السعر النهائي بالدينار الجزائري (د.ج)' : 'Price in DZD (د.ج)'}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={Math.round(editPriceUsd * 220)}
                              onChange={(e) => setEditPriceUsd(Number(e.target.value) / 220)}
                              className="w-full bg-surface-container-lowest border border-emerald-500/50 rounded-lg p-2 pr-12 text-xs font-mono font-bold text-emerald-400 outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <span className="absolute right-3 top-2 text-xs font-bold text-emerald-400 pointer-events-none">
                              {language === 'ar' ? 'د.ج' : 'DZD'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingServiceId(null)}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-white text-xs font-medium cursor-pointer"
                          >
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveServiceEdit(srv)}
                            className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-white font-bold text-xs cursor-pointer flex items-center gap-1 shadow"
                          >
                            <Check size={14} />
                            <span>{language === 'ar' ? 'حفظ السعر' : 'Save Price'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-primary-container font-black text-sm">
                              {language === 'ar' ? srv.nameAr : srv.nameEn}
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant line-clamp-1">
                            {language === 'ar' ? srv.descAr : srv.descEn}
                          </p>

                          {/* Price Badge */}
                          <div className="pt-2 flex items-center gap-2 font-mono">
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                              {priceDzdCalculated.toLocaleString()} {language === 'ar' ? 'د.ج' : 'DZD'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditService(srv)}
                            className="p-2 rounded-lg bg-surface-container hover:bg-primary-container hover:text-white text-primary-container transition-all cursor-pointer border border-outline-variant/30"
                            title={language === 'ar' ? 'تعديل السعر والمعلومات' : 'Edit Price & Details'}
                          >
                            <Edit3 size={15} />
                          </button>

                          {onDeleteRepairService && repairServices.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                askConfirmation(
                                  language === 'ar' ? 'حذف خدمة تصليح' : 'Delete Repair Service',
                                  language === 'ar' ? `هل أنت متأكد من حذف خدمة (${srv.nameAr})؟` : `Delete ${srv.nameEn}?`,
                                  () => {
                                    onDeleteRepairService(srv.id);
                                    setRepairServiceFeedback(language === 'ar' ? 'تم حذف خدمة التصليح بنجاح' : 'Service deleted');
                                    setTimeout(() => setRepairServiceFeedback(''), 3000);
                                  }
                                );
                              }}
                              className="p-2 rounded-lg bg-surface-container hover:bg-red-500 hover:text-white text-red-400 transition-all cursor-pointer border border-outline-variant/30"
                              title={language === 'ar' ? 'حذف الخدمة' : 'Delete Service'}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Baridimob RIP Control Card */}
            <div className="bg-surface-container border border-outline-variant/30 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <Sliders size={18} className="text-primary-container" />
                <span>{language === 'ar' ? 'التحكم في رقم RIP لبريديموب' : 'Baridimob RIP Configuration'}</span>
              </h3>
              
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {language === 'ar' 
                  ? 'هذا الرقم يظهر للزبائن عند اختيارهم وسيلة الدفع بريديموب أثناء إتمام الطلب لتسهيل إرسال الأموال.' 
                  : 'This RIP code is shown to customers during checkout when they choose the Baridimob pre-payment option.'}
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide block">
                  {language === 'ar' ? 'رقم الـ RIP الحالي *' : 'Current RIP Number *'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempRip}
                    onChange={(e) => setTempRip(e.target.value)}
                    placeholder="e.g., 007999990023456789 23"
                    className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-white outline-none focus:border-primary-container font-mono font-bold tracking-wider text-sm"
                  />
                  <button
                    onClick={handleUpdateRip}
                    className="bg-primary-container hover:bg-primary-container/90 text-white px-4 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Check size={14} />
                    <span>{language === 'ar' ? 'تحديث' : 'Update'}</span>
                  </button>
                </div>
                {ripFeedback && (
                  <p className="text-green-400 text-xs font-bold flex items-center gap-1 animate-pulse">
                    ✅ {ripFeedback}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Phones CRUD Card */}
            <div className="bg-surface-container border border-outline-variant/30 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <User size={18} className="text-primary-container" />
                <span>{language === 'ar' ? 'إدارة أرقام هواتف اتصل بنا' : 'Contact Support Lines'}</span>
              </h3>
              
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {language === 'ar' 
                  ? 'قم بإضافة، تعديل، أو حذف أرقام الهواتف التي تظهر للزبائن في واجهة اتصل بنا وأسفل الموقع للتواصل المباشر.' 
                  : 'Add, update, or remove phone numbers shown to clients on the home screen and footer.'}
              </p>

              {/* Add / Edit Phone Form */}
              <div className="bg-surface-container-lowest/60 border border-outline-variant/40 p-4 rounded-xl space-y-3">
                <label className="text-xs font-bold text-on-surface-variant block">
                  {editingPhoneIndex !== null 
                    ? (language === 'ar' ? 'تعديل الرقم الحالي' : 'Edit Selected Line') 
                    : (language === 'ar' ? 'إضافة رقم هاتف جديد' : 'Add New Support Line')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    placeholder="e.g., 0555 12 34 56"
                    className="flex-1 bg-surface-container border border-outline-variant rounded-xl p-3 text-white outline-none focus:border-primary-container font-mono font-bold text-sm"
                  />
                  <button
                    onClick={handleSavePhone}
                    className="bg-primary-container hover:bg-primary-container/90 text-white px-4 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {editingPhoneIndex !== null ? <Check size={14} /> : <PlusCircle size={14} />}
                    <span>{editingPhoneIndex !== null ? (language === 'ar' ? 'حفظ' : 'Save') : (language === 'ar' ? 'إضافة' : 'Add')}</span>
                  </button>
                </div>
                {phoneFeedback && (
                  <p className="text-green-400 text-xs font-bold flex items-center gap-1 animate-pulse">
                    ✅ {phoneFeedback}
                  </p>
                )}
                {phoneError && (
                  <p className="text-red-400 text-xs font-bold flex items-center gap-1 animate-pulse">
                    ❌ {phoneError}
                  </p>
                )}
              </div>

              {/* Phones List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {contactPhones.length === 0 ? (
                  <p className="text-on-surface-variant text-center py-4 text-xs italic">
                    {language === 'ar' ? 'لا توجد أرقام هواتف مسجلة حالياً.' : 'No phone numbers currently registered.'}
                  </p>
                ) : (
                  contactPhones.map((phone, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-surface-container-highest/40 border border-outline-variant/30 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-primary-container/10 text-primary-container text-[10px] font-bold flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-sm font-bold text-on-surface">{phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingPhoneIndex(idx);
                            setTempPhone(phone);
                          }}
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors cursor-pointer"
                          title={language === 'ar' ? 'تعديل' : 'Edit'}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeletePhone(idx)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                          title={language === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Social Media Links Card */}
            <div className="bg-surface-container border border-outline-variant/30 p-6 rounded-2xl space-y-4 lg:col-span-2">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <Sparkles size={18} className="text-primary-container" />
                <span>{language === 'ar' ? 'التحكم في حسابات التواصل الاجتماعي' : 'Social Media Channels'}</span>
              </h3>
              
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {language === 'ar' 
                  ? 'قم بتعيين روابط حسابات فيسبوك، إنستغرام، وتيك توك الخاصة بمحلك. ستظهر هذه الروابط في أسفل الموقع لتسهيل وصول الزبائن إليها.' 
                  : 'Configure the social media URLs for your shop (Facebook, Instagram, and TikTok). These links are dynamically displayed in the global website footer.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Facebook Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1.5">
                    <Facebook size={14} className="text-[#1877F2]" />
                    <span>Facebook</span>
                  </label>
                  <input
                    type="url"
                    value={tempFb}
                    onChange={(e) => setTempFb(e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-on-surface outline-none focus:border-primary-container font-mono text-sm"
                  />
                </div>

                {/* Instagram Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1.5">
                    <Instagram size={14} className="text-[#E1306C]" />
                    <span>Instagram</span>
                  </label>
                  <input
                    type="url"
                    value={tempIg}
                    onChange={(e) => setTempIg(e.target.value)}
                    placeholder="https://instagram.com/yourprofile"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-on-surface outline-none focus:border-primary-container font-mono text-sm"
                  />
                </div>

                {/* TikTok Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 fill-current text-on-surface" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.5-.13-.1-.23-.22-.35-.33v5.39c-.06 2.45-1.12 4.93-3.08 6.45-2.2 1.74-5.32 2.19-7.94 1.14-2.48-.98-4.32-3.37-4.66-6.02-.45-3.18 1.15-6.6 4.12-7.85 1.15-.49 2.41-.65 3.65-.51V11c-.96-.13-1.98.05-2.82.59-.97.6-1.57 1.68-1.63 2.81-.08 1.49.88 2.94 2.29 3.39 1.25.41 2.73.08 3.61-.88.75-.81.99-1.95.95-3.03V.02z" />
                    </svg>
                    <span>TikTok</span>
                  </label>
                  <input
                    type="url"
                    value={tempTiktok}
                    onChange={(e) => setTempTiktok(e.target.value)}
                    placeholder="https://tiktok.com/@yourusername"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-on-surface outline-none focus:border-primary-container font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  {socialFeedback && (
                    <p className="text-green-400 text-xs font-bold flex items-center gap-1 animate-pulse">
                      ✅ {socialFeedback}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleUpdateSocials}
                  className="bg-primary-container hover:bg-primary-container/90 text-white px-6 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{language === 'ar' ? 'حفظ التغييرات' : 'Save Social Channels'}</span>
                </button>
              </div>
            </div>

            {/* Master Password Control Card */}
            <div className="bg-surface-container border border-outline-variant/30 p-6 rounded-2xl space-y-4 lg:col-span-2">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <Lock size={18} className="text-primary-container" />
                <span>{language === 'ar' ? 'تغيير كلمة مرور المشرف (الماستر)' : 'Change Master Admin Password'}</span>
              </h3>
              
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {language === 'ar' 
                  ? 'هنا يمكنك تغيير كلمة المرور المطلوبة لتسجيل الدخول إلى لوحة التحكم هذه. يرجى تذكر كلمة المرور الجديدة جيداً لمنع فقدان الوصول.' 
                  : 'Change the master authentication password used to sign in to this portal. Please store your new password safely.'}
              </p>

              <form onSubmit={handleChangeMasterPassword} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide block">
                    {language === 'ar' ? 'كلمة المرور الحالية *' : 'Current Password *'}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-on-surface outline-none focus:border-primary-container font-mono text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide block">
                    {language === 'ar' ? 'كلمة المرور الجديدة *' : 'New Password *'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-on-surface outline-none focus:border-primary-container font-mono text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide block">
                    {language === 'ar' ? 'تأكيد كلمة المرور الجديدة *' : 'Confirm New Password *'}
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-on-surface outline-none focus:border-primary-container font-mono text-sm"
                    required
                  />
                </div>

                <div className="md:col-span-3 flex items-center justify-between pt-2">
                  <div>
                    {passwordChangeFeedback && (
                      <p className="text-green-400 text-xs font-bold flex items-center gap-1 animate-pulse">
                        ✅ {passwordChangeFeedback}
                      </p>
                    )}
                    {passwordChangeError && (
                      <p className="text-red-400 text-xs font-bold flex items-center gap-1 animate-pulse">
                        ❌ {passwordChangeError}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="bg-primary-container hover:bg-primary-container/90 text-white px-6 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>{language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Reset Metrics and Data Control Card */}
            <div className="bg-surface-container border border-outline-variant/30 p-6 rounded-2xl space-y-4 lg:col-span-2">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <RotateCw size={18} className="text-red-400" />
                <span>{language === 'ar' ? 'تصفير وإعادة ضبط البيانات والمنتجات (جاهز للتسليم)' : 'Reset & Zero Out System for Handover'}</span>
              </h3>
              
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {language === 'ar' 
                  ? 'يمكنك تصفير المنتجات والمبيعات المحققة والطلبيات بالكامل ليكون المتجر جاهزاً تماماً للتسليم إلى العميل بدون أي بيانات أو أجهزة تجريبية، أو يمكنك اختيار تصفير المبيعات فقط مع الاحتفاظ بالمنتجات.' 
                  : 'Zero out products, sales revenue, and pending orders to prepare a clean, empty store for client handover, or zero out sales while keeping products.'}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      askConfirmation(
                        language === 'ar' ? 'تصفير المنتجات والمبيعات بالكامل' : 'Zero Out Products & Sales',
                        language === 'ar' ? 'هل أنت متأكد من تصفير كافة المنتجات والمبيعات والطلبات لتسليم المتجر فارغاً ومكتمل التجهيز؟' : 'Are you sure you want to zero out all products, sales, and orders for store handover?',
                        () => {
                          onZeroAllDataAndProducts?.();
                          setResetFeedback(language === 'ar' ? 'تم تصفير المنتجات والمبيعات والطلبات بالكامل! المتجر جاهز الآن للتسليم (0 د.ج).' : 'All products, sales, and orders zeroed out! Ready for handover (0 DZD).');
                          setTimeout(() => setResetFeedback(''), 5000);
                        }
                      );
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white font-black px-5 py-3 rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2 shadow-lg shadow-red-500/20"
                  >
                    <Trash2 size={15} />
                    <span>{language === 'ar' ? '🚀 تصفير المنتجات والمبيعات بالكامل (جاهز للتسليم)' : '🚀 Zero Out Products & Sales (Ready for Delivery)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      askConfirmation(
                        language === 'ar' ? 'تصفير المنتجات فقط' : 'Clear Products Only',
                        language === 'ar' ? 'هل أنت متأكد من تصفير المنتجات فقط إلى 0 منتج؟' : 'Are you sure you want to clear all products only?',
                        () => {
                          onClearProducts?.();
                          setResetFeedback(language === 'ar' ? 'تم تصفير قائمة المنتجات بنجاح (0 منتج)' : 'Products list zeroed out (0 products)');
                          setTimeout(() => setResetFeedback(''), 4000);
                        }
                      );
                    }}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-4 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    <span>{language === 'ar' ? 'تصفير المنتجات فقط (0 منتج)' : 'Clear Products Only'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      askConfirmation(
                        language === 'ar' ? 'تصفير المبيعات فقط' : 'Zero Sales Only',
                        language === 'ar' ? 'هل أنت متأكد من تصفير المبيعات والطلبات فقط (0 د.ج)؟' : 'Are you sure you want to zero out sales metrics only?',
                        () => {
                          onResetMetrics();
                          setResetFeedback(language === 'ar' ? 'تم تصفير المبيعات والإحصائيات بنجاح إلى 0 د.ج!' : 'Sales and metrics zeroed out to 0 DZD!');
                          setTimeout(() => setResetFeedback(''), 4000);
                        }
                      );
                    }}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-4 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <RotateCw size={14} />
                    <span>{language === 'ar' ? 'تصفير المبيعات فقط (0 د.ج)' : 'Zero Sales Only (0 DZD)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onRestoreDemoMetrics();
                      setResetFeedback(language === 'ar' ? 'تم استرجاع المنتجات والبيانات النموذجية بنجاح!' : 'Initial demo products and metrics restored successfully!');
                      setTimeout(() => setResetFeedback(''), 4000);
                    }}
                    className="bg-surface-container-highest hover:bg-surface-container-high text-white border border-outline-variant/30 px-4 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    <span>{language === 'ar' ? 'استرجاع العينات والبيانات' : 'Restore Demo Data'}</span>
                  </button>
                </div>

                {resetFeedback && (
                  <p className="text-green-400 text-xs font-bold flex items-center gap-1 animate-pulse bg-green-500/10 border border-green-500/30 px-3 py-2 rounded-xl">
                    ✅ {resetFeedback}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal for adding a new Repair Service */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container border border-outline-variant/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary-container" />
                <span>{language === 'ar' ? 'إضافة خدمة صيانة وتصليح جديدة' : 'Add New Repair Service'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddServiceModal(false)}
                className="text-on-surface-variant hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewService} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant block mb-1">
                    {language === 'ar' ? 'اسم الخدمة (بالعربية) *' : 'Service Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newSrvNameAr}
                    onChange={(e) => setNewSrvNameAr(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: استبدال مايكروفون الصوت' : 'e.g. Microphone Replacement'}
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary-container font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant block mb-1">
                    {language === 'ar' ? 'اسم الخدمة (بالإنجليزية) *' : 'Service Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newSrvNameEn}
                    onChange={(e) => setNewSrvNameEn(e.target.value)}
                    placeholder="e.g. Microphone Replacement"
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary-container font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant block mb-1">
                    {language === 'ar' ? 'الوصف (بالعربية)' : 'Description (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={newSrvDescAr}
                    onChange={(e) => setNewSrvDescAr(e.target.value)}
                    placeholder={language === 'ar' ? 'تغيير مايكروفون أصلي متوافق' : 'OEM Mic Replacement'}
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant block mb-1">
                    {language === 'ar' ? 'الوصف (بالإنجليزية)' : 'Description (English)'}
                  </label>
                  <input
                    type="text"
                    value={newSrvDescEn}
                    onChange={(e) => setNewSrvDescEn(e.target.value)}
                    placeholder="OEM Mic Replacement"
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary-container"
                  />
                </div>
              </div>

              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                <label className="text-xs font-bold text-emerald-400 block mb-1">
                  {language === 'ar' ? 'السعر بالدينار الجزائري (د.ج) *' : 'Price in DZD (د.ج) *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={Math.round(newSrvPriceUsd * 220)}
                    onChange={(e) => setNewSrvPriceUsd(Number(e.target.value) / 220)}
                    className="w-full bg-surface-container border border-emerald-500/40 rounded-xl p-2.5 text-xs font-mono font-bold text-emerald-400 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-emerald-400 pointer-events-none">
                    {language === 'ar' ? 'د.ج' : 'DZD'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:text-white text-xs font-medium cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-container hover:bg-primary-container/90 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <PlusCircle size={15} />
                  <span>{language === 'ar' ? 'إضافة الخدمة' : 'Add Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Replaces window.confirm for iframe & browser compatibility) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-surface-container-high border border-outline-variant/60 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">{confirmModal.message}</p>
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 px-4 bg-surface-container-highest hover:bg-surface-container border border-outline-variant/40 rounded-xl text-xs font-bold text-on-surface hover:text-white transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  action();
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/30 cursor-pointer active:scale-95"
              >
                {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
