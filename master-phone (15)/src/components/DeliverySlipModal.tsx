import { Language, Order } from '../types';
import { wilayas } from '../data/wilayas';
import { Printer, X, ShieldCheck, Truck, Phone, MapPin, PackageCheck, AlertCircle } from 'lucide-react';

interface DeliverySlipModalProps {
  order: Order;
  language: Language;
  onClose: () => void;
  contactPhones?: string[];
}

export default function DeliverySlipModal({
  order,
  language,
  onClose,
  contactPhones = ['0555 12 34 56', '0666 78 90 12'],
}: DeliverySlipModalProps) {
  const exchangeRate = 220; // 1 USD = 220 DZD

  const wilayaObj = wilayas.find((w) => w.code === order.wilayaCode);
  const wilayaName = wilayaObj ? (language === 'ar' ? `${wilayaObj.code} - ${wilayaObj.nameAr}` : `${wilayaObj.code} - ${wilayaObj.nameEn}`) : order.wilayaCode;

  const totalDzd = Math.round(order.totalUsd * exchangeRate);

  const generatePrintHtml = () => {
    const printContent = document.getElementById('delivery-slip-printable')?.outerHTML || '';
    return `<!DOCTYPE html>
<html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
  <head>
    <meta charset="utf-8" />
    <title>${language === 'ar' ? 'وصل تسليم وشحن' : 'Delivery Slip'} - ${order.id}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @page { size: A4 portrait; margin: 8mm; }
      body { 
        font-family: system-ui, -apple-system, sans-serif; 
        background: #f8fafc; 
        color: #0f172a; 
        padding: 20px;
        display: flex;
        justify-content: center;
      }
      #delivery-slip-printable { 
        max-width: 800px;
        width: 100%;
        background: #ffffff !important; 
        color: #0f172a !important;
        border: 2px solid #0f172a !important;
        padding: 24px !important;
        border-radius: 12px;
      }
      @media print {
        body { background: #ffffff !important; padding: 0 !important; }
        #delivery-slip-printable { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; border: 2px solid #000 !important; }
        .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <div style="width: 100%; max-width: 800px;">
      <div style="text-align:center; margin-bottom:15px;" class="no-print">
        <button onclick="window.print()" style="background:#0284c7; color:#ffffff; font-weight:bold; padding:12px 28px; border:none; border-radius:10px; cursor:pointer; font-size:15px; box-shadow: 0 4px 12px rgba(2,132,199,0.3);">
          🖨️ ${language === 'ar' ? 'اضغط هنا للطباعة أو الحفظ كـ PDF' : 'Click Here to Print or Save PDF'}
        </button>
      </div>
      ${printContent}
    </div>
    <script>
      window.onload = function() {
        setTimeout(function() {
          try { window.print(); } catch(e){}
        }, 400);
      };
    </script>
  </body>
</html>`;
  };

  const handleDownloadHtml = () => {
    const htmlContent = generatePrintHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Delivery_Slip_${order.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleOpenNewTab = () => {
    const htmlContent = generatePrintHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const newWin = window.open(url, '_blank');
    if (!newWin) {
      // Fallback if popup blocked
      handleDownloadHtml();
    }
  };

  const handleDirectPrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error('Direct print blocked', e);
      handleOpenNewTab();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* Print-specific style override */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          #delivery-slip-printable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            padding: 20px !important;
            margin: 0 !important;
            z-index: 999999 !important;
          }
        }
      `}</style>

      <div 
        className="relative w-full max-w-2xl bg-surface-container border border-outline-variant/60 rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-4 no-print">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary-container/20 text-primary-container">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-on-surface">
                {language === 'ar' ? 'وصل تسليم وشحن الطلبية' : 'Delivery Voucher Slip'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {language === 'ar' ? 'جاهز للطباعة والتسليم لسائق شركة التوصيل' : 'Ready to print for courier & delivery agent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewTab}
              className="bg-primary-container hover:bg-primary-container/90 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-95"
              title={language === 'ar' ? 'فتح الوصل في نافذة مستقلة للطباعة' : 'Open in new tab to print'}
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'ar' ? 'فتح للطباعة' : 'Print / Open'}</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 border border-outline-variant/40 cursor-pointer transition-all active:scale-95"
              title={language === 'ar' ? 'تحميل ملف الوصل بصيغة HTML جاهز للطباعة' : 'Download printable file'}
            >
              <span>{language === 'ar' ? 'تحميل الوصل 📄' : 'Download 📄'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-container-highest hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Tip Banner for iframe compatibility */}
        <div className="bg-primary-container/10 border border-primary-container/30 rounded-2xl p-3 text-xs text-on-surface flex items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary-container shrink-0" />
            <span>
              {language === 'ar' 
                ? 'خيار ممتاز: اضغط "فتح للطباعة" لفتح الوصل في تبويب مستقل وطباعته أو حفظه كـ PDF بنقرة واحدة.' 
                : 'Tip: Click "Print / Open" to open the slip in a fresh browser tab or "Download" to save it.'}
            </span>
          </div>
        </div>

        {/* PRINTABLE SLIP CONTAINER - Pure White Paper Theme */}
        <div 
          id="delivery-slip-printable"
          className="bg-white text-slate-900 p-6 rounded-2xl border-2 border-slate-300 shadow-lg text-left dir-auto space-y-5"
        >
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-primary-container tracking-tight">MASTER PHONE</span>
                <span className="bg-primary-container/10 border border-primary-container/30 text-primary-container px-2 py-0.5 rounded text-[10px] font-extrabold">
                  ماستر فون
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {language === 'ar' ? 'أصحاب المحل: خلفاوي علاء & خلفاوي يونس' : 'Owners: Khalfawi Alaa & Khalfawi Younes'}
              </p>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5 flex items-center gap-1 font-bold">
                <Phone className="w-3.5 h-3.5 text-primary-container shrink-0" />
                <span>{contactPhones.join(' / ')}</span>
              </p>
            </div>

            {/* Document Title & Order Barcode simulation */}
            <div className="text-right sm:text-left bg-slate-100 p-3 rounded-xl border border-slate-300 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-container block">
                {language === 'ar' ? 'وصل تسليم وشحن' : 'DELIVERY MANIFEST'}
              </span>
              <span className="text-sm font-mono font-black text-slate-900 block mt-0.5">
                {order.id}
              </span>
              <div className="text-[10px] font-mono text-slate-700 mt-1 tracking-widest select-none font-bold">
                ||| |||| | ||| |||||| | |||
              </div>
              <span className="text-[10px] text-slate-600 font-semibold block mt-0.5">
                {order.date}
              </span>
            </div>
          </div>

          {/* Customer Details & Delivery Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                {language === 'ar' ? 'معلومات الزبون (المستلم):' : 'Customer (Recipient) Info:'}
              </span>
              <h3 className="text-sm font-black text-slate-900">
                {order.customerName}
              </h3>
              <p className="text-xs font-mono font-black text-primary-container mt-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{order.customerPhone}</span>
              </p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                {language === 'ar' ? 'عنوان التوصيل والولاية:' : 'Delivery Address & Wilaya:'}
              </span>
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary-container shrink-0" />
                <span>{wilayaName}</span>
              </p>
              <p className="text-xs text-slate-700 font-semibold mt-1 leading-snug">
                {order.address}
              </p>
            </div>
          </div>

          {/* Package Content Items */}
          <div>
            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1">
              <PackageCheck className="w-4 h-4 text-primary-container" />
              <span>{language === 'ar' ? 'محتويات الطرد (الأجهزة وقطع الغيار):' : 'Package Contents:'}</span>
            </span>

            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">{language === 'ar' ? 'المنتج / الجهاز' : 'Product / Item'}</th>
                    <th className="p-2.5 text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                    <th className="p-2.5 text-right">{language === 'ar' ? 'السعر' : 'Price'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900">
                  {order.items.map((item, idx) => {
                    const itemDzd = Math.round(item.priceUsd * item.quantity * exchangeRate);
                    return (
                      <tr key={idx} className="font-bold">
                        <td className="p-2.5 text-slate-900">{item.productName}</td>
                        <td className="p-2.5 text-center font-mono text-primary-container font-black">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono text-slate-900">{itemDzd.toLocaleString()} د.ج</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* COD Collection Box (CRITICAL FOR DELIVERY COMPANY) */}
          <div className="bg-emerald-50 border-2 border-emerald-500/60 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                {language === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}
              </span>
              <span className="text-xs font-black text-slate-900">
                {order.paymentMethod === 'cod' 
                  ? (language === 'ar' ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD)') 
                  : (language === 'ar' ? `تحويل بريديموب (Baridimob) ${order.baridimobReceiptUrl ? '📷 [مرفق بصل التحويل]' : ''}` : `Baridimob Transfer ${order.baridimobReceiptUrl ? '📷 [Receipt Screenshot Attached]' : ''}`)}
              </span>
            </div>

            <div className="text-right sm:text-left bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-300 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase text-emerald-900 block">
                {language === 'ar' ? 'المبلغ المراد تحصيله عند التسليم:' : 'TOTAL COD AMOUNT TO COLLECT:'}
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono block">
                {totalDzd.toLocaleString()} {language === 'ar' ? 'د.ج' : 'DZD'}
              </span>
            </div>
          </div>

          {/* Courier Instructions & Conditions */}
          <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl space-y-1 text-[11px] text-amber-950 font-semibold">
            <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
              <span>{language === 'ar' ? 'تعليمات هامة لسائق شركة التوصيل:' : 'Important Carrier Instructions:'}</span>
            </div>
            <p className="leading-snug">
              {language === 'ar' 
                ? '• يُسمح للزبون بفتح العلبة ومعاينة الجهاز مع السائق قبل الدفع للتأكد من جودة الطلبية.'
                : '• Customer is permitted to open package and verify hardware before making payment.'}
            </p>
            <p className="leading-snug">
              {language === 'ar' 
                ? '• في حالة وجود أي استفسار أو تعذر الوصول للزبون، يرجى الاتصال بإدارة المحل على الفور.'
                : '• If unable to contact customer, please immediately call store management.'}
            </p>
          </div>

          {/* Footer Signatures Area */}
          <div className="pt-4 border-t border-slate-300 flex justify-between items-end text-[10px] font-extrabold text-slate-700">
            <div>
              <p>{language === 'ar' ? 'ختم وتوقيع المحل:' : 'Store Stamp & Signature:'}</p>
              <div className="mt-2 w-28 h-10 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] text-slate-500 font-black">
                MASTER PHONE
              </div>
            </div>
            <div className="text-right">
              <p>{language === 'ar' ? 'توقيع المستلم / السائق:' : 'Driver / Recipient Signature:'}</p>
              <div className="mt-2 w-28 h-10 border border-dashed border-slate-400 rounded"></div>
            </div>
          </div>

        </div>

        {/* Bottom Print Action (Hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 no-print border-t border-outline-variant/30 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="px-4 py-2.5 rounded-xl bg-surface-container-highest hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center gap-2 border border-outline-variant/40 cursor-pointer transition-all active:scale-95"
            >
              <span>{language === 'ar' ? 'تحميل ملف الوصل (HTML)' : 'Download HTML File'}</span>
            </button>
            <button
              onClick={handleOpenNewTab}
              className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-primary-container/90 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary-container/20 cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'ar' ? 'فتح الوصل والطباعة الآن' : 'Open & Print Voucher'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
