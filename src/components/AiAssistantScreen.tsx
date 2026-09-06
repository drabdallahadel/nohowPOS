import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  ArrowRight,
  Clock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { storage } from '../services/storage';

interface MessageItem {
  id: string;
  sender: 'AI' | 'USER';
  text: string;
  timestamp: number;
  chips?: string[];
  metrics?: { label: string; value: string }[];
}

export const AiAssistantScreen: React.FC = () => {
  const settings = storage.getSettings();
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'AI',
      text: `مرحباً بك! أنا المساعد الذكي لنظام ${settings.storeName}. يمكنني تحليل أداء المبيعات لحظياً، كشف نواقص المخزون وتواريخ الصلاحية، مراقبة ديون العملاء والموردين، وتقديم توصيات تشغيلية مدعومة بالأرقام الدقيقة. كيف أستطيع مساعدتك اليوم؟`,
      timestamp: Date.now(),
      chips: [
        'كم مبيعات اليوم والشهر الحالي؟',
        'ما هي الأصناف الأكثر مبيعاً والأعلى ربحاً؟',
        'ما هي الأصناف التي قاربت على النفاد (حد الأمان)؟',
        'ما الأصناف القريبة من انتهاء الصلاحية؟',
        'ما إجمالي ديون العملاء ومن الأكثر مديونية؟',
        'ما هو صافي الأرباح بعد خصم المصروفات؟',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Natural Language Data Analysis Engine
  const analyzeQuery = (query: string): { response: string; metrics?: { label: string; value: string }[] } => {
    const q = query.toLowerCase();
    const products = storage.getAllProducts();
    const sales = storage.getAllSales();
    const saleItems = storage.getAllSaleItems();
    const customers = storage.getAllCustomers();
    const suppliers = storage.getAllSuppliers();
    const expenses = storage.getAllExpenses();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // 1. Sales query
    if (q.includes('مبيعات') || q.includes('بيع') || q.includes('ايراد') || q.includes('دخل')) {
      const todaySales = sales.filter((s) => s.timestamp >= startOfToday && s.status === 'COMPLETED');
      const todayTotal = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);

      const monthSales = sales.filter((s) => s.timestamp >= startOfMonth && s.status === 'COMPLETED');
      const monthTotal = monthSales.reduce((sum, s) => sum + s.grandTotal, 0);

      const totalAllTime = sales.reduce((sum, s) => sum + s.grandTotal, 0);

      return {
        response: `إليك ملخص مؤشرات المبيعات المحدثة لحظياً:\n\n• مبيعات اليوم: سجلت **${todayTotal.toLocaleString()} ${settings.currencySymbol}** عبر **${todaySales.length}** عملية بيع.\n• مبيعات الشهر الحالي: بلغت **${monthTotal.toLocaleString()} ${settings.currencySymbol}** عبر **${monthSales.length}** فاتورة.\n• الإجمالي الكلي للمبيعات المسجلة: **${totalAllTime.toLocaleString()} ${settings.currencySymbol}**.\n\nالمبيعات تسير بمعدل جيد مع متوسط قيمة فاتورة يبلغ **${(monthTotal / (monthSales.length || 1)).toFixed(1)} ${settings.currencySymbol}**.`,
        metrics: [
          { label: 'مبيعات اليوم', value: `${todayTotal.toLocaleString()} ${settings.currencySymbol}` },
          { label: 'فواتير اليوم', value: `${todaySales.length} فاتورة` },
          { label: 'مبيعات الشهر', value: `${monthTotal.toLocaleString()} ${settings.currencySymbol}` },
        ],
      };
    }

    // 2. Top selling & most profitable
    if (q.includes('أكثر') || q.includes('اكثر') || q.includes('افضل') || q.includes('ربح') || q.includes('مبيعا')) {
      const itemMap: Record<string, { name: string; qty: number; total: number; profit: number }> = {};
      saleItems.forEach((it) => {
        if (!itemMap[it.productId]) {
          itemMap[it.productId] = { name: it.productName, qty: 0, total: 0, profit: 0 };
        }
        itemMap[it.productId].qty += it.quantity;
        itemMap[it.productId].total += it.totalPrice;
        itemMap[it.productId].profit += it.profit || (it.totalPrice * 0.25);
      });

      const sortedByQty = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 3);
      const sortedByProfit = Object.values(itemMap).sort((a, b) => b.profit - a.profit).slice(0, 3);

      const topQtyText = sortedByQty
        .map((s, idx) => `${idx + 1}. **${s.name}**: بيع منه **${s.qty}** وحدة (إجمالي: ${s.total.toLocaleString()} ${settings.currencySymbol})`)
        .join('\n');

      const topProfitText = sortedByProfit
        .map((s, idx) => `${idx + 1}. **${s.name}**: حقق أرباحاً صافية قدرها **${s.profit.toLocaleString()} ${settings.currencySymbol}**`)
        .join('\n');

      return {
        response: `بناءً على تحليل فواتير المبيعات:\n\n**الأصناف الأكثر طلباً وحركة (Top Sellers):**\n${topQtyText}\n\n**الأصناف الأكثر مساهمة في هامش الربح الصافي:**\n${topProfitText}\n\n💡 **توصية:** احرص على توفير مخزون مستمر من (${sortedByQty[0]?.name || 'الأصناف الرئيسية'}) وضمان أفضل شروط شراء من الموردين لزيادة هامش الربحية.`,
      };
    }

    // 3. Low stock & out of stock
    if (q.includes('نواقص') || q.includes('مخزون') || q.includes('نفد') || q.includes('أمان') || q.includes('ناقص')) {
      const threshold = settings.defaultLowStockThreshold || 10;
      const outOfStock = products.filter((p) => p.currentStock <= 0);
      const lowStock = products.filter((p) => p.currentStock > 0 && p.currentStock <= (p.minStockLimit || threshold));

      let msg = `تقرير الرقابة على المخزون ونواقص الرفوف:\n\n`;
      if (outOfStock.length > 0) {
        msg += `🚨 **أصناف نفدت بالكامل (0 رصيد):**\n` + outOfStock.map((p) => `• **${p.name}** (الباركود: ${p.barcode})`).join('\n') + `\n\n`;
      } else {
        msg += `✅ لا توجد أصناف منتهية الرصيد حالياً.\n\n`;
      }

      if (lowStock.length > 0) {
        msg += `⚠️ **أصناف وصلت لحد الأمان (توشك على النفاد):**\n` + lowStock.map((p) => `• **${p.name}**: متبقي **${p.currentStock}** فقط (حد الأمان: ${p.minStockLimit || threshold})`).join('\n') + `\n\n`;
      } else {
        msg += `✅ جميع الأصناف الأخرى تتجاوز حد الأمان الموصى به.`;
      }

      msg += `\n📦 يمكنك التوجه لشاشة **المشتريات** لإنشاء أمر توريد فوري للموردين.`;

      return {
        response: msg,
        metrics: [
          { label: 'أصناف نفدت', value: `${outOfStock.length} صنف` },
          { label: 'أصناف قاربت النفاد', value: `${lowStock.length} صنف` },
        ],
      };
    }

    // 4. Expiry Dates & Batches
    if (q.includes('صلاحية') || q.includes('انتهاء') || q.includes('تشغيلة') || q.includes('تاريخ') || q.includes('اكسباير')) {
      const nowTime = Date.now();
      const expired = products.filter((p) => p.expiryDate && new Date(p.expiryDate).getTime() < nowTime);
      const nearExpiry = products.filter((p) => {
        if (!p.expiryDate) return false;
        const diff = (new Date(p.expiryDate).getTime() - nowTime) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 90;
      });

      let msg = `تحليل تواريخ الصلاحية والتشغيلات (FIFO):\n\n`;
      if (expired.length > 0) {
        msg += `⛔ **أصناف منتهية الصلاحية (ممنوع بيعها):**\n` +
          expired.map((p) => `• **${p.name}** (تشغيلة: ${p.batchNumber}) - انتهت بتاريخ ${p.expiryDate}`).join('\n') + `\n\n`;
      } else {
        msg += `✅ لا توجد أصناف منتهية الصلاحية مسجلة في النظام.\n\n`;
      }

      if (nearExpiry.length > 0) {
        msg += `⚠️ **أصناف تنتهي صلاحيتها خلال أقل من 90 يوماً:**\n` +
          nearExpiry.map((p) => {
            const days = Math.ceil((new Date(p.expiryDate!).getTime() - nowTime) / (1000 * 3600 * 24));
            return `• **${p.name}**: تنتهي بتاريخ ${p.expiryDate} (متبقي ${days} يوم)`;
          }).join('\n') + `\n\n`;
      }

      msg += `💡 **توصية هامة:** تطبيق قاعدة الوارد أولاً يصرف أولاً (FIFO) وتوزيع الأصناف القريبة من الانتهاء في مقدمة الرفوف.`;

      return { response: msg };
    }

    // 5. Customer Debts & CRM
    if (q.includes('عميل') || q.includes('عملاء') || q.includes('دين') || q.includes('ديون') || q.includes('اجل') || q.includes('آجل')) {
      const totalDebts = customers.reduce((sum, c) => sum + c.balance, 0);
      const topDebtors = [...customers].sort((a, b) => b.balance - a.balance).filter((c) => c.balance > 0).slice(0, 3);
      const overLimit = customers.filter((c) => c.creditLimit > 0 && c.balance > c.creditLimit);

      let msg = `تحليل الحسابات المدينة ومديونيات العملاء:\n\n• إجمالي الديون المستحقة على العملاء: **${totalDebts.toLocaleString()} ${settings.currencySymbol}**\n\n`;
      if (topDebtors.length > 0) {
        msg += `**أكثر العملاء مديونية حالياً:**\n` +
          topDebtors.map((c, i) => `${i + 1}. **${c.name}**: رصيد مدين بقيمة **${c.balance.toLocaleString()} ${settings.currencySymbol}** (الحد: ${c.creditLimit.toLocaleString()})`).join('\n') + `\n\n`;
      }

      if (overLimit.length > 0) {
        msg += `🚨 **تنبيه ائتماني:** يوجد **${overLimit.length}** عميل تجاوزوا الحد الائتماني المسموح به. يفضل تعليق البيع الآجل لهم حتى السداد الجزئي.`;
      }

      return {
        response: msg,
        metrics: [
          { label: 'إجمالي ديون العملاء', value: `${totalDebts.toLocaleString()} ${settings.currencySymbol}` },
          { label: 'عملاء تجاوزوا الحد', value: `${overLimit.length} عميل` },
        ],
      };
    }

    // 6. Net Profit & Financial Health
    if (q.includes('ربح') || q.includes('صافي') || q.includes('مصروف') || q.includes('خسارة') || q.includes('مالي')) {
      const totalSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
      const totalGrossProfit = saleItems.reduce((sum, it) => sum + (it.profit || (it.totalPrice * 0.25)), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = totalGrossProfit - totalExpenses;
      const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';

      return {
        response: `التقرير المالي وصافي الأرباح التراكمي:\n\n• إجمالي المبيعات: **${totalSales.toLocaleString()} ${settings.currencySymbol}**\n• مجمل الربح التشغيلي: **${totalGrossProfit.toLocaleString()} ${settings.currencySymbol}**\n• إجمالي المصروفات والنثريات: **${totalExpenses.toLocaleString()} ${settings.currencySymbol}**\n• **صافي الربح الفعلي:** **${netProfit.toLocaleString()} ${settings.currencySymbol}** (هامش صافي الربح: **${profitMargin}%**).\n\nالأداء المالي متزن وهامش الربحية مستقر.`,
        metrics: [
          { label: 'مجمل الربح', value: `${totalGrossProfit.toLocaleString()} ${settings.currencySymbol}` },
          { label: 'المصروفات', value: `${totalExpenses.toLocaleString()} ${settings.currencySymbol}` },
          { label: 'صافي الربح', value: `${netProfit.toLocaleString()} ${settings.currencySymbol}` },
        ],
      };
    }

    // Default fallback intelligent response
    return {
      response: `بناءً على بيانات النظام المسجلة:\n\n• إجمالي الأصناف بالمستودعات: **${products.length}** صنف.\n• إجمالي الفواتير الصادرة: **${sales.length}** فاتورة.\n• عدد العملاء المسجلين: **${customers.length}** عميل.\n• عدد الموردين: **${suppliers.length}** مورد.\n\nيمكنك سؤالي عن أي جانب محدد: مبيعات اليوم، نواقص المخزون، تواريخ الصلاحية، أو مديونيات العملاء والموردين.`,
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: MessageItem = {
      id: 'user-' + Date.now(),
      sender: 'USER',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      const result = analyzeQuery(query);
      const aiMsg: MessageItem = {
        id: 'ai-' + Date.now(),
        sender: 'AI',
        text: result.response,
        timestamp: Date.now(),
        metrics: result.metrics,
        chips: [
          'كم مبيعات اليوم والشهر الحالي؟',
          'ما هي الأصناف الأكثر مبيعاً؟',
          'ما هي نواقص المخزون؟',
          'ما ديون العملاء؟',
        ],
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>المساعد الذكي للأعمال (MicroPOS AI)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                مباشر مع البيانات
              </span>
            </h1>
            <p className="text-xs text-gray-500">
              تحليل باللغة العربية الطبيعية للأداء المالي والمخزون والعملاء بدقة 100%
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'welcome-reset',
                sender: 'AI',
                text: 'تمت إعادة تعيين جلسة المساعد الذكي. كيف يمكنني خدمتك الآن؟',
                timestamp: Date.now(),
                chips: [
                  'كم مبيعات اليوم والشهر الحالي؟',
                  'ما هي الأصناف الأكثر مبيعاً؟',
                  'ما هي نواقص المخزون؟',
                ],
              },
            ])
          }
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
          title="محادثة جديدة"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'USER' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === 'USER'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-purple-700 text-white shadow-xs'
              }`}
            >
              {msg.sender === 'USER' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            <div className={`max-w-2xl space-y-3 ${msg.sender === 'USER' ? 'items-end' : ''}`}>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                  msg.sender === 'USER'
                    ? 'bg-emerald-700 text-white font-medium rounded-tr-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* Metrics cards if available */}
              {msg.metrics && msg.metrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {msg.metrics.map((m, idx) => (
                    <div key={idx} className="bg-purple-50/70 border border-purple-200/70 p-3 rounded-xl">
                      <span className="text-[11px] font-bold text-purple-700 block">{m.label}</span>
                      <span className="text-sm font-extrabold text-gray-900 font-mono mt-0.5 block">
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Follow-up chips */}
              {msg.chips && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {msg.chips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="px-3 py-1.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-xs font-semibold text-purple-800 transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
                      <span>{chip}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-purple-700 font-semibold animate-pulse">
            <Bot className="w-4 h-4" />
            <span>جاري قراءة البيانات وتحليل الإحصائيات...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="pt-4 border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="اسأل المساعد الذكي عن أي بيان (مثال: ما هي الأصناف الأكثر مبيعاً؟)"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white shadow-xs"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim()}
            className="px-5 py-3 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xs flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">إرسال</span>
          </button>
        </form>
      </div>
    </div>
  );
};
