"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Package,
  ShoppingCart,
  FileText,
  DollarSign,
  Building,
  LayoutDashboard,
  Plus,
  Trash,
  PlusCircle,
  LogOut,
  Globe,
  CreditCard,
  TrendingUp,
  UserPlus,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Loader,
  Search,
  Percent,
  Warehouse,
  FolderPlus,
  Coins,
  QrCode
} from "lucide-react";

const getApiUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.startsWith("192.168.")) {
      return "https://saas-ybcv.onrender.com";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
};

export default function Home() {
  const [apiUrl, setApiUrl] = useState(() => getApiUrl());
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const API_BASE_URL = apiUrl;

  // --- AUTH STATE ---
  const [token, setToken] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authLoading, setAuthLoading] = useState(false);

  // Onboarding form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBusinessName, setRegBusinessName] = useState("");
  const [regSubdomain, setRegSubdomain] = useState("");
  const [regIndustryType, setRegIndustryType] = useState("RETAIL");
  const [regPlanName, setRegPlanName] = useState("BUSINESS");

  // --- CORE DATA STATE ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // --- UI NAVIGATION & GENERAL STATE ---
  const [activeTab, setActiveTab] = useState<"dashboard" | "customers" | "products" | "pos" | "invoices" | "expenses">("dashboard");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- MODALS / SUB-FORMS STATE ---
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustTax, setNewCustTax] = useState("");
  const [newCustLimit, setNewCustLimit] = useState(1000);
  const [newCustShipping, setNewCustShipping] = useState("");
  const [newCustBilling, setNewCustBilling] = useState("");

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdBrand, setNewProdBrand] = useState("");
  const [newProdSKU, setNewProdSKU] = useState("");
  const [newProdBarcode, setNewProdBarcode] = useState("");
  const [newProdPrice, setNewProdPrice] = useState(99.99);
  const [newProdCost, setNewProdCost] = useState(60.0);
  const [newProdColor, setNewProdColor] = useState("Graphite");

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpAmount, setNewExpAmount] = useState(50);
  const [newExpCategory, setNewExpCategory] = useState("UTILITIES");
  const [newExpDesc, setNewExpDesc] = useState("");

  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [newWhName, setNewWhName] = useState("");
  const [newWhAddress, setNewWhAddress] = useState("");

  const [showAdjustStock, setShowAdjustStock] = useState(false);
  const [adjWarehouseId, setAdjWarehouseId] = useState("");
  const [adjVariantId, setAdjVariantId] = useState("");
  const [adjQty, setAdjQty] = useState(100);

  // --- POS CART STATE ---
  const [posWarehouseId, setPosWarehouseId] = useState("");
  const [posCustomerId, setPosCustomerId] = useState("");
  const [posPaymentMethod, setPosPaymentMethod] = useState("CARD");
  const [posCart, setPosCart] = useState<any[]>([]);
  const [posSearchQuery, setPosSearchQuery] = useState("");
  const [posAmountPaid, setPosAmountPaid] = useState("");
  const [posCheckoutSuccess, setPosCheckoutSuccess] = useState<any>(null);

  // --- EFFECTS ---
  useEffect(() => {
    // Read token from localStorage on mount
    const savedToken = localStorage.getItem("crm_access_token");
    if (savedToken) {
      setToken(savedToken);
      decodeTenantFromToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  // Decode basic tenant/user claims from standard JWT payload part
  const decodeTenantFromToken = (jwtToken: string) => {
    try {
      const payloadPart = jwtToken.split(".")[1];
      if (payloadPart) {
        const decoded = JSON.parse(atob(payloadPart));
        setTenantInfo(decoded);
      }
    } catch (e) {
      console.error("Failed to decode token", e);
    }
  };

  // --- API CALLS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "فشلت عملية تسجيل الدخول. يرجى التحقق من البيانات.");
      }
      localStorage.setItem("crm_access_token", data.accessToken);
      setToken(data.accessToken);
      decodeTenantFromToken(data.accessToken);
      showTemporarySuccess("تم تسجيل الدخول بنجاح! مرحباً بك.");
    } catch (err: any) {
      setErrorMsg(err.message || "فشل الاتصال بالخادم.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: regFirstName,
          lastName: regLastName,
          email: regEmail,
          password: regPassword,
          businessName: regBusinessName,
          subdomain: regSubdomain,
          industryType: regIndustryType,
          planName: regPlanName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        throw new Error(msg || "فشل تسجيل المنشأة. تحقق من القيم المدخلة.");
      }
      localStorage.setItem("crm_access_token", data.accessToken);
      setToken(data.accessToken);
      decodeTenantFromToken(data.accessToken);
      showTemporarySuccess("تم تهيئة مساحة العمل للمنشأة وتسجيل الدخول بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء التسجيل.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_access_token");
    setToken(null);
    setTenantInfo(null);
    setCustomers([]);
    setProducts([]);
    setWarehouses([]);
    setInvoices([]);
    setExpenses([]);
    setPosCart([]);
    setPosCheckoutSuccess(null);
    setActiveTab("dashboard");
  };

  const fetchAllData = async () => {
    if (!token) return;
    setDataLoading(true);
    setErrorMsg(null);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Fetch Customers
      const custRes = await fetch(`${API_BASE_URL}/customers`, { headers });
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData);
      }

      // 2. Fetch Products
      const prodRes = await fetch(`${API_BASE_URL}/products`, { headers });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }

      // 3. Fetch Warehouses
      const whRes = await fetch(`${API_BASE_URL}/warehouses`, { headers });
      if (whRes.ok) {
        const whData = await whRes.json();
        setWarehouses(whData);
        if (whData.length > 0 && !posWarehouseId) {
          setPosWarehouseId(whData[0].id);
        }
      }

      // 4. Fetch Invoices
      const invRes = await fetch(`${API_BASE_URL}/invoices`, { headers });
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData);
      }

      // 5. Fetch Expenses
      const expRes = await fetch(`${API_BASE_URL}/expenses`, { headers });
      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData);
      }
    } catch (err: any) {
      setErrorMsg("فشلت عملية مزامنة البيانات مع الخادم الرئيسي.");
    } finally {
      setDataLoading(false);
    }
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // --- ACTIONS ---
  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCustName,
          email: newCustEmail || undefined,
          phone: newCustPhone || undefined,
          taxNumber: newCustTax || undefined,
          creditLimit: Number(newCustLimit),
          shippingAddress: newCustShipping || undefined,
          billingAddress: newCustBilling || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذر تسجيل ملف العميل.");
      
      setCustomers([data, ...customers]);
      setShowAddCustomer(false);
      // Reset form
      setNewCustName("");
      setNewCustEmail("");
      setNewCustPhone("");
      setNewCustTax("");
      setNewCustLimit(1000);
      setNewCustShipping("");
      setNewCustBilling("");
      showTemporarySuccess(`تم تسجيل العميل '${data.name}' بنجاح.`);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProdName,
          description: newProdDesc || undefined,
          brand: newProdBrand || undefined,
          isVariantParent: true,
          variants: [
            {
              sku: newProdSKU,
              barcode: newProdBarcode || undefined,
              price: Number(newProdPrice),
              costPrice: Number(newProdCost),
              attributes: { Color: newProdColor },
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذر تسجيل المنتج في الدليل.");
      
      setProducts([data, ...products]);
      setShowAddProduct(false);
      // Reset form
      setNewProdName("");
      setNewProdDesc("");
      setNewProdBrand("");
      setNewProdSKU("");
      setNewProdBarcode("");
      setNewProdPrice(99.99);
      setNewProdCost(60.0);
      showTemporarySuccess(`تم إدراج المنتج '${data.name}' مع أصنافه الخاصة بنجاح.`);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const createWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/warehouses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newWhName,
          address: newWhAddress || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذر تسجيل المستودع.");
      
      setWarehouses([...warehouses, data]);
      setShowAddWarehouse(false);
      setNewWhName("");
      setNewWhAddress("");
      showTemporarySuccess(`تم تسجيل المستودع/الفرع '${data.name}' بنجاح.`);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const adjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/warehouses/adjust-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          warehouseId: adjWarehouseId,
          variantId: adjVariantId,
          quantity: Number(adjQty),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشلت عملية تسوية المخزون.");
      
      setShowAdjustStock(false);
      fetchAllData(); // reload products to show new stock balances
      showTemporarySuccess("تم تسوية وتحديث كميات المخزن بنجاح.");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const createExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(newExpAmount),
          category: newExpCategory,
          description: newExpDesc,
          expenseDate: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذر تسجيل المصروف.");
      
      setExpenses([data, ...expenses]);
      setShowAddExpense(false);
      setNewExpAmount(50);
      setNewExpDesc("");
      showTemporarySuccess("تم قيد المصروفات التشغيلية بنجاح.");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- POS CART ACTIONS ---
  const addToCart = (product: any, variant: any) => {
    const existing = posCart.find((item) => item.variantId === variant.id);
    if (existing) {
      setPosCart(
        posCart.map((item) =>
          item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setPosCart([
        ...posCart,
        {
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          sku: variant.sku,
          quantity: 1,
          unitPrice: Number(variant.price),
          taxRate: 15.0, // Default 15% VAT
          discountAmount: 0.0,
        },
      ]);
    }
  };

  const updateCartQty = (variantId: string, qty: number) => {
    if (qty <= 0) {
      setPosCart(posCart.filter((item) => item.variantId !== variantId));
    } else {
      setPosCart(
        posCart.map((item) => (item.variantId === variantId ? { ...item, quantity: qty } : item))
      );
    }
  };

  const calculateCartSubtotal = () => {
    return posCart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  };

  const calculateCartTax = () => {
    return posCart.reduce((acc, item) => {
      const sub = item.unitPrice * item.quantity - item.discountAmount;
      return acc + sub * (item.taxRate / 100);
    }, 0);
  };

  const calculateCartTotal = () => {
    return calculateCartSubtotal() + calculateCartTax();
  };

  const handlePOSCheckout = async () => {
    if (!token) return;
    if (!posWarehouseId) {
      setErrorMsg("يرجى اختيار مستودع أولاً للخصم منه.");
      return;
    }
    if (posCart.length === 0) {
      setErrorMsg("سلة المشتريات فارغة.");
      return;
    }
    setErrorMsg(null);
    setPosCheckoutSuccess(null);

    const total = calculateCartTotal();
    const paid = Number(posAmountPaid) || total;

    try {
      const res = await fetch(`${API_BASE_URL}/invoices/pos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          warehouseId: posWarehouseId,
          customerId: posCustomerId || undefined,
          paymentMethod: posPaymentMethod,
          amountPaid: paid,
          items: posCart.map((item) => ({
            variantId: item.variantId,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate),
            discountAmount: Number(item.discountAmount),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذر إتمام عملية البيع.");

      setPosCheckoutSuccess(data);
      setPosCart([]);
      setPosAmountPaid("");
      fetchAllData(); // refresh stock balances and lists
      showTemporarySuccess("تم إتمام الفاتورة وتحديث المخزون والمالية بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- STATS / METRICS FOR DASHBOARD ---
  const totalSales = invoices.reduce((acc, inv) => acc + Number(inv.grandTotal), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
  const netProfit = totalSales - totalExpenses;
  const totalStockQty = products.reduce((acc, p) => {
    let q = 0;
    p.variants?.forEach((v: any) => {
      v.balances?.forEach((b: any) => {
        q += Number(b.quantity);
      });
    });
    return acc + q;
  }, 0);

  // --- RENDER COMPONENT ---
  if (!token) {
    // ONBOARDING & LOGIN SCREEN
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-6 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
        {/* Glowing abstract background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="flex justify-center items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 animate-pulse">
              <Building className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-violet-400 bg-clip-text text-transparent">
              أنتي غرافيتي ERP
            </span>
          </div>
          <h2 className="mt-6 text-center text-lg font-medium text-slate-400">
            {authMode === "login" ? "تسجيل الدخول إلى مساحة عمل منشأتك" : "تأسيس مساحة عمل سحابية جديدة للمنشأة"}
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 hover:border-slate-700/80 transition-all duration-300">
            {errorMsg && (
              <div className="mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-start gap-2.5 text-sm animate-pulse">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-start gap-2.5 text-sm">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {authMode === "login" ? (
              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm transition-all focus:outline-none text-right"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm transition-all focus:outline-none text-right"
                    placeholder="••••••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer"
                >
                  {authLoading ? <Loader className="w-5 h-5 animate-spin" /> : "تسجيل الدخول للمنشأة"}
                </button>
              </form>
            ) : (
              <form className="space-y-4.5" onSubmit={handleRegister}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم الأول</label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-white text-xs transition-all focus:outline-none text-right"
                      placeholder="أحمد"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">اسم العائلة</label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-white text-xs transition-all focus:outline-none text-right"
                      placeholder="علي"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-white text-xs transition-all focus:outline-none text-right"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">كلمة المرور (12 خانة على الأقل)</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-white text-xs transition-all focus:outline-none text-right"
                    placeholder="••••••••••••"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المنشأة / الشركة</label>
                    <input
                      type="text"
                      required
                      value={regBusinessName}
                      onChange={(e) => setRegBusinessName(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-white text-xs transition-all focus:outline-none text-right"
                      placeholder="مؤسسة التقنية للتجارة"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">النطاق الفرعي</label>
                    <input
                      type="text"
                      required
                      value={regSubdomain}
                      onChange={(e) => setRegSubdomain(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-white text-xs transition-all focus:outline-none font-mono text-left"
                      placeholder="tech-trade"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">مجال العمل</label>
                    <select
                      value={regIndustryType}
                      onChange={(e) => setRegIndustryType(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 py-2.5 text-white text-xs transition-all focus:outline-none"
                    >
                      <option value="RETAIL">تجارة التجزئة</option>
                      <option value="GARAGE">ورش صيانة السيارات</option>
                      <option value="TAILOR">مشغل خياطة وحياكة</option>
                      <option value="WHOLESALE">تجارة الجملة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">خطة الفوترة</label>
                    <select
                      value={regPlanName}
                      onChange={(e) => setRegPlanName(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 py-2.5 text-white text-xs transition-all focus:outline-none"
                    >
                      <option value="BUSINESS">خطة الأعمال (موصى بها)</option>
                      <option value="STARTER">الخطة الأساسية للمبتدئين</option>
                      <option value="PROFESSIONAL">الخطة الاحترافية للشركات</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-3 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {authLoading ? <Loader className="w-5 h-5 animate-spin" /> : "تهيئة وتأسيس مساحة العمل"}
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-slate-800/80 pt-4.5 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setErrorMsg(null);
                }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {authMode === "login" ? "ليس لديك مساحة عمل؟ أنشئ حساباً الآن" : "لديك حساب للمنشأة؟ سجل الدخول هنا"}
              </button>
            </div>

            {/* API Connection Settings */}
            <div className="mt-4 border-t border-slate-800/40 pt-4">
              <button
                type="button"
                onClick={() => setShowApiSettings(!showApiSettings)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <span>إعدادات الاتصال بالخادم الرئيسي (API)</span>
                <span>{showApiSettings ? "إخفاء التكوين" : "عرض وضبط التكوين"}</span>
              </button>

              {showApiSettings && (
                <div className="mt-3 space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/50 text-right">
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">رابط بوابة الـ API النشط</label>
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => {
                        setApiUrl(e.target.value);
                        setTestStatus("idle");
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono text-left"
                      placeholder="https://saas-ybcv.onrender.com"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setTestStatus("testing");
                        try {
                          const res = await fetch(`${apiUrl}/`, { method: "GET" });
                          if (res.ok || res.status === 404) {
                            setTestStatus("success");
                          } else {
                            setTestStatus("failed");
                          }
                        } catch (e) {
                          setTestStatus("failed");
                        }
                      }}
                      disabled={testStatus === "testing"}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold rounded-lg text-slate-300 transition-colors cursor-pointer"
                    >
                      {testStatus === "testing" ? "جاري الاختبار..." : "اختبار كفاءة الاتصال"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setApiUrl("https://saas-ybcv.onrender.com");
                        setTestStatus("idle");
                      }}
                      className="px-2.5 py-1.5 hover:bg-slate-800 text-[10px] font-medium rounded-lg text-slate-400 transition-colors cursor-pointer"
                    >
                      السحابة
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setApiUrl("http://localhost:4000");
                        setTestStatus("idle");
                      }}
                      className="px-2.5 py-1.5 hover:bg-slate-800 text-[10px] font-medium rounded-lg text-slate-400 transition-colors cursor-pointer"
                    >
                      محلي
                    </button>
                  </div>

                  {testStatus === "success" && (
                    <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>تم الاتصال بنجاح! خادم الخلفية نشط ومتصل بقاعدة Supabase.</span>
                    </p>
                  )}
                  {testStatus === "failed" && (
                    <p className="text-[10px] text-rose-400 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      <span>فشل الاتصال بالخادم. تحقق من عنوان الرابط أو حالة الاستضافة.</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD SCREEN ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Background decoration elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none"></div>

      {/* HEADERBAR */}
      <header className="bg-slate-900/40 backdrop-blur-xl border-b border-slate-900 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Building className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-white">
              {tenantInfo?.businessName || "أنتي غرافيتي ERP"}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Globe className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">{tenantInfo?.subdomain}.crmsaas.app</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold text-[9px] ms-1">
                {tenantInfo?.roles?.includes("OWNER") ? "المالك الأساسي" : "مسؤول"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchAllData}
            disabled={dataLoading}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 border border-slate-800 hover:bg-slate-800/40 hover:border-slate-700/80 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-slate-300"
          >
            {dataLoading ? (
              <Loader className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Warehouse className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>مزامنة قواعد البيانات</span>
          </button>
          
          <div className="hidden sm:block text-left text-end">
            <p className="text-xs font-bold text-white">
              {tenantInfo?.email}
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>نشط ومحمي</span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 border border-slate-800 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* DASHBOARD BODY LAYOUT */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* SIDEBAR NAVIGATION - Renders on the RIGHT side in RTL */}
        <aside className="w-full lg:w-68 bg-slate-900/10 border-b lg:border-b-0 lg:border-l border-slate-900 p-4 shrink-0 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible">
          <div className="hidden lg:block px-4 py-2 mb-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">لوحات التحكم والمحاسبة</p>
          </div>
          
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "dashboard"
                ? "bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500 font-bold"
                : "text-slate-400 hover:bg-slate-900/40 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span>الرئيسية والإحصاءات</span>
          </button>
          
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "customers"
                ? "bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500 font-bold"
                : "text-slate-400 hover:bg-slate-900/40 hover:text-white"
            }`}
          >
            <Users className="w-5 h-5 shrink-0" />
            <span>إدارة العملاء (CRM)</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "products"
                ? "bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500 font-bold"
                : "text-slate-400 hover:bg-slate-900/40 hover:text-white"
            }`}
          >
            <Package className="w-5 h-5 shrink-0" />
            <span>دليل المنتجات والمخزن</span>
          </button>

          <button
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "pos"
                ? "bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-500 font-bold"
                : "text-slate-400 hover:bg-slate-900/40 hover:text-white"
            }`}
          >
            <ShoppingCart className="w-5 h-5 shrink-0 text-emerald-500" />
            <span className="text-emerald-400">فاتورة الكاشير (POS)</span>
          </button>

          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "invoices"
                ? "bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500 font-bold"
                : "text-slate-400 hover:bg-slate-900/40 hover:text-white"
            }`}
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span>سجل الفواتير الصادرة</span>
          </button>

          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "expenses"
                ? "bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500 font-bold"
                : "text-slate-400 hover:bg-slate-900/40 hover:text-white"
            }`}
          >
            <DollarSign className="w-5 h-5 shrink-0" />
            <span>المصروفات والخزينة</span>
          </button>
        </aside>

        {/* MAIN VIEW AREA */}
        <main className="flex-1 p-6 relative">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-2xl flex items-start gap-3 text-sm relative animate-pulse text-right">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">فشل الإجراء: </span>
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="absolute top-3.5 left-4 text-slate-500 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-start gap-3 text-sm text-right">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">نجاح العملية: </span>
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* LOADING STATE COVER */}
          {dataLoading && customers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">جاري جلب ومزامنة بيانات المنشأة مع قاعدة Supabase...</p>
            </div>
          )}

          {/* TAB CONTENT: 1. DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* METRIC CARD GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-900/40 to-indigo-950/5 border-t-4 border-indigo-500 border-x border-b border-slate-900 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-800 transition-all duration-300 text-right">
                  <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">إجمالي المبيعات</span>
                    <Coins className="w-4.5 h-4.5 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-black text-white mt-2 font-mono">${totalSales.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-indigo-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>مباشر من نقاط البيع</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900/40 to-rose-950/5 border-t-4 border-rose-500 border-x border-b border-slate-900 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-800 transition-all duration-300 text-right">
                  <div className="absolute top-0 left-0 w-24 h-24 bg-rose-500/5 rounded-full -translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">إجمالي المصروفات</span>
                    <DollarSign className="w-4.5 h-4.5 text-rose-400" />
                  </div>
                  <p className="text-2xl font-black text-white mt-2 font-mono">${totalExpenses.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
                    <span>يشمل تكاليف التشغيل والمرافق</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900/40 to-emerald-950/5 border-t-4 border-emerald-500 border-x border-b border-slate-900 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-800 transition-all duration-300 text-right">
                  <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">صافي الأرباح</span>
                    <Coins className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <p className={`text-2xl font-black mt-2 font-mono ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    ${netProfit.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-400">
                    <span>الهامش المالي الفعلي الحالي</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900/40 to-amber-950/5 border-t-4 border-amber-500 border-x border-b border-slate-900 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-800 transition-all duration-300 text-right">
                  <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">كمية المخزون</span>
                    <Package className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <p className="text-2xl font-black text-white mt-2 font-mono">{totalStockQty} وحدة</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-400">
                    <span>موزعة على {warehouses.length} مستودع/فرع</span>
                  </div>
                </div>
              </div>

              {/* SECONDARY INFO BLOCK: WAREHOUSES & RECENT ACTIVITY */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* WAREHOUSE REGISTRY SUMMARY */}
                <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl lg:col-span-1 space-y-4 shadow-sm text-right">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Warehouse className="w-4.5 h-4.5 text-indigo-400" />
                      <span>المستودعات والفروع</span>
                    </h3>
                    <button
                      onClick={() => setShowAddWarehouse(true)}
                      className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white rounded-lg text-indigo-400 transition-all cursor-pointer"
                      title="إضافة مستودع جديد"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {warehouses.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8">لا توجد فروع مسجلة حالياً. أضف مستودعاً لتسجيل المخزون.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {warehouses.map((wh) => (
                        <div key={wh.id} className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl flex items-center justify-between hover:border-slate-800 transition-colors">
                          <div>
                            <p className="text-xs font-bold text-white">{wh.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{wh.address || "لم يتم تسجيل تفاصيل العنوان"}</p>
                          </div>
                          <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md">
                            نشط
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowAdjustStock(true)}
                    className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                  >
                    توريد وتسوية كميات المخزون
                  </button>
                </div>

                {/* RECENT INVOICES CHECKOUT LOG */}
                <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl lg:col-span-2 space-y-4 shadow-sm text-right">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-indigo-400" />
                      <span>آخر العمليات وفواتير المبيعات</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab("invoices")}
                      className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer"
                    >
                      عرض السجل بالكامل
                    </button>
                  </div>

                  {invoices.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-12">لا توجد مبيعات مسجلة حتى الآن.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-400">
                            <th className="pb-3.5 font-bold">رقم الفاتورة</th>
                            <th className="pb-3.5 font-bold">العميل</th>
                            <th className="pb-3.5 font-bold">طريقة السداد</th>
                            <th className="pb-3.5 font-bold text-left">المجموع الكلي</th>
                            <th className="pb-3.5 font-bold text-center">حالة السداد</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/60">
                          {invoices.slice(0, 5).map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-900/20 transition-colors">
                              <td className="py-3 font-mono text-slate-300 font-bold">{inv.invoiceNumber}</td>
                              <td className="py-3 text-slate-300">{inv.customer?.name || "عميل نقدي عابر"}</td>
                              <td className="py-3 text-[10px] font-bold text-slate-400">
                                {inv.paymentMethod === "CARD" ? "مدى / بطاقة" : inv.paymentMethod === "CASH" ? "نقدي" : "تحويل بنكي"}
                              </td>
                              <td className="py-3 text-left font-extrabold text-white font-mono">${Number(inv.grandTotal).toFixed(2)}</td>
                              <td className="py-3 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                  inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                }`}>
                                  {inv.status === "PAID" ? "مدفوعة" : "مسودة"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. CRM CUSTOMERS */}
          {activeTab === "customers" && (
            <div className="space-y-5 text-right">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">دليل عملاء المنشأة (CRM)</h2>
                  <p className="text-xs text-slate-400 mt-1">تتبع وتسجيل حسابات العملاء، الأرصدة المستحقة، وحدود الائتمان المسموحة</p>
                </div>
                <button
                  onClick={() => setShowAddCustomer(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>تسجيل عميل جديد</span>
                </button>
              </div>

              {/* CUSTOMERS LISTING TABLE */}
              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-sm">
                {customers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-20">لا يوجد عملاء مسجلين حالياً. اضغط على "تسجيل عميل جديد" للبدء.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900/40 text-slate-300 border-b border-slate-900">
                        <tr>
                          <th className="px-5 py-4 font-bold">الاسم والملف التعريفى</th>
                          <th className="px-5 py-4 font-bold">معلومات الاتصال</th>
                          <th className="px-5 py-4 font-bold">الرقم الضريبي</th>
                          <th className="px-5 py-4 font-bold">الحد الائتماني</th>
                          <th className="px-5 py-4 font-bold">الرصيد المستحق</th>
                          <th className="px-5 py-4 font-bold">تاريخ التسجيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {customers.map((cust) => (
                          <tr key={cust.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-white text-sm block">{cust.name}</span>
                              <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{cust.id}</span>
                            </td>
                            <td className="px-5 py-3.5 space-y-0.5">
                              <span className="block text-slate-300">{cust.email || "لم يسجل بريد"}</span>
                              <span className="block text-slate-400 text-[10px] font-mono">{cust.phone || "بدون رقم جوال"}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-300">{cust.taxNumber || "—"}</td>
                            <td className="px-5 py-3.5 font-bold text-white font-mono">${Number(cust.creditLimit).toFixed(2)}</td>
                            <td className="px-5 py-3.5">
                              <span className={`font-extrabold font-mono ${Number(cust.outstandingBalance) > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                ${Number(cust.outstandingBalance).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-400">
                              {new Date(cust.createdAt).toLocaleDateString("ar-SA")}
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

          {/* TAB CONTENT: 3. PRODUCT CATALOG */}
          {activeTab === "products" && (
            <div className="space-y-5 text-right">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">دليل المنتجات والمستودع</h2>
                  <p className="text-xs text-slate-400 mt-1">عرض وتصنيف السلع المتوفرة، تكلفة الشراء، أسعار البيع وتتبع الباركود (UPC)</p>
                </div>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>إضافة منتج جديد</span>
                </button>
              </div>

              {/* PRODUCTS LISTING */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {products.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-20 lg:col-span-2">دليل المنتجات خالي حالياً. يرجى تسجيل أول منتج للمنشأة.</p>
                ) : (
                  products.map((p) => (
                    <div key={p.id} className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-4 hover:border-slate-800 transition-all duration-300 shadow-sm">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded">
                            {p.brand || "بدون علامة تجارية"}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">الرمز التعريفى: {p.id.slice(0, 8)}</span>
                        </div>
                        <h3 className="font-bold text-base text-white mt-2">{p.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{p.description || "لم يسجل وصف تفصيلي للمنتج."}</p>
                      </div>

                      {/* Variants and stock listing */}
                      <div className="border-t border-slate-900 pt-3.5 space-y-2.5 text-right">
                        <h4 className="text-xs font-bold text-slate-300">أكواد وأصناف المنتجات المسجلة (SKUs):</h4>
                        {p.variants?.map((v: any) => (
                          <div key={v.id} className="bg-slate-950/80 border border-slate-900 p-3 rounded-xl flex items-center justify-between text-xs gap-3">
                            <div className="space-y-1 text-right">
                              <p className="font-mono font-bold text-indigo-400 text-right">{v.sku}</p>
                              {v.barcode && (
                                <p className="text-[10px] text-slate-500 flex items-center gap-1 font-mono justify-start">
                                  <QrCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>{v.barcode}</span>
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 text-right">
                                {Object.keys(v.attributes || {}).map((k) => `${k}: ${v.attributes[k]}`).join(" | ") || "بدون خصائص إضافية"}
                              </p>
                            </div>

                            <div className="text-left shrink-0 space-y-1">
                              <p className="font-extrabold text-white font-mono">${Number(v.price).toFixed(2)}</p>
                              <p className="text-[9px] text-slate-500 font-mono">التكلفة: ${Number(v.costPrice).toFixed(2)}</p>
                              <div className="mt-1 flex justify-end">
                                {v.balances && v.balances.length > 0 ? (
                                  v.balances.map((bal: any) => (
                                    <span key={bal.id} className="inline-block text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md ms-1">
                                      {bal.warehouse?.name || "المستودع"}: {Number(bal.quantity)} وحدة
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md">
                                    نفذت الكمية
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 4. POS CASHIER CHECKOUT */}
          {activeTab === "pos" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-right">
              {/* RIGHT COLUMN: PRODUCTS BROWSER (3/5 width) - Rendered first in Arabic RTL flow */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <ShoppingCart className="w-5.5 h-5.5 text-emerald-400" />
                      <span>شاشة المحاسبة المباشرة (POS)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">اختر أصناف المنتجات المتوفرة لتسجيل عملية بيع فوري وإصدار إيصال</p>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={posWarehouseId}
                      onChange={(e) => setPosWarehouseId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
                    >
                      <option value="">اختر مستودع السحب...</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SEARCH PRODUCTS */}
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <Search className="h-4.5 w-4.5 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    value={posSearchQuery}
                    onChange={(e) => setPosSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-900 rounded-xl pr-10 pl-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 text-right"
                    placeholder="ابحث باسم السلعة، رقم الكود المخزني (SKU) أو الباركود..."
                  />
                </div>

                {/* PRODUCTS LIST */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
                  {products
                    .filter((p) =>
                      p.name.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
                      p.variants?.some((v: any) => v.sku.toLowerCase().includes(posSearchQuery.toLowerCase()))
                    )
                    .map((p) =>
                      p.variants?.map((v: any) => {
                        const stockBal = v.balances?.find((b: any) => b.warehouseId === posWarehouseId)?.quantity || 0;
                        return (
                          <div
                            key={v.id}
                            onClick={() => Number(stockBal) > 0 && addToCart(p, v)}
                            className={`bg-slate-900/20 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-200 group text-right ${
                              Number(stockBal) > 0 ? "cursor-pointer" : "opacity-45 cursor-not-allowed"
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{p.brand || "عام"}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                  Number(stockBal) > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                }`}>
                                  {Number(stockBal) > 0 ? `المتوفر: ${Number(stockBal)}` : "غير متوفر"}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-white mt-2 group-hover:text-emerald-400 transition-colors">{p.name}</h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-1 text-right">SKU: {v.sku}</p>
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-2.5 border-t border-slate-950">
                              <span className="font-extrabold text-sm text-emerald-400 font-mono">${Number(v.price).toFixed(2)}</span>
                              {Number(stockBal) > 0 && (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg hover:bg-emerald-500 hover:text-white transition-all cursor-pointer">
                                  إضافة للسلة
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                </div>
              </div>

              {/* LEFT COLUMN: POS CHECKOUT CART (2/5 width) - Rendered on the left side */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-5 flex flex-col min-h-[580px] justify-between shadow-sm text-right">
                  <div>
                    <h3 className="font-bold text-sm text-white border-b border-slate-950 pb-3.5 flex items-center justify-between">
                      <span>سلة المشتريات الحالية</span>
                      <span className="text-xs text-slate-400 font-bold">({posCart.length}) منتجات</span>
                    </h3>

                    {/* SELECT CUSTOMER */}
                    <div className="space-y-2 mt-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">ربط المعاملة بعميل مسجل (اختياري)</label>
                        <select
                          value={posCustomerId}
                          onChange={(e) => setPosCustomerId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 text-xs rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="">عميل نقدي عابر (افتراضي)</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>{c.name} (رصيد مستحق: ${Number(c.outstandingBalance).toFixed(2)})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* CART LISTING */}
                    {posCart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs space-y-3">
                        <ShoppingCart className="w-9 h-9 text-slate-700 animate-bounce" />
                        <p>السلة فارغة حالياً. اضغط على المنتجات المتوفرة لإضافتها.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-4 max-h-[240px] overflow-y-auto pr-1">
                        {posCart.map((item) => (
                          <div key={item.variantId} className="bg-slate-950/60 border border-slate-900 p-3 rounded-2xl flex items-center justify-between gap-3 text-right">
                            <div className="min-w-0 text-right">
                              <p className="font-bold text-white text-xs truncate text-right">{item.productName}</p>
                              <p className="font-mono text-[9px] text-indigo-400 mt-0.5 text-right">{item.sku}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer text-white"
                              >
                                -
                              </button>
                              <span className="w-5 text-center text-xs font-bold font-mono">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer text-white"
                              >
                                +
                              </button>
                              <span className="font-extrabold text-white text-xs ms-2 font-mono">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CHECKOUT TOTALS & BUTTON */}
                  <div className="border-t border-slate-950 pt-4 mt-4 space-y-4 text-right">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>المجموع الفرعي (قبل الضريبة)</span>
                        <span className="font-bold font-mono">${calculateCartSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>ضريبة القيمة المضافة (15.00% VAT)</span>
                        <span className="font-bold font-mono">${calculateCartTax().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-white font-extrabold text-sm pt-2 border-t border-slate-900">
                        <span>المجموع النهائي الإجمالي</span>
                        <span className="text-emerald-400 font-black font-mono">${calculateCartTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">طريقة السداد</label>
                        <select
                          value={posPaymentMethod}
                          onChange={(e) => setPosPaymentMethod(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 text-[11px] rounded-lg px-2.5 py-2 focus:outline-none text-white focus:border-indigo-500 font-bold cursor-pointer"
                        >
                          <option value="CARD">بطاقة مدى / ائتمان</option>
                          <option value="CASH">دفع نقدي</option>
                          <option value="TRANSFER">تحويل بنكي</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">المبلغ المدفوع ($)</label>
                        <input
                          type="text"
                          value={posAmountPaid}
                          onChange={(e) => setPosAmountPaid(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 text-[11px] rounded-lg px-2.5 py-2 focus:outline-none text-white focus:border-indigo-500 text-left font-mono"
                          placeholder={`${calculateCartTotal().toFixed(2)}`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePOSCheckout}
                      className="w-full mt-3 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-2xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] cursor-pointer text-center"
                    >
                      إعتماد وإصدار إيصال الفاتورة المبسطة
                    </button>
                  </div>
                </div>

                {/* PRINT INVOICE RECEIPT OVERLAY */}
                {posCheckoutSuccess && (
                  <div className="bg-slate-900 border border-emerald-500/20 p-5 rounded-3xl space-y-4 shadow-xl text-right">
                    <div className="flex items-center gap-2 text-emerald-400 justify-end">
                      <CheckCircle className="w-5.5 h-5.5" />
                      <h4 className="font-bold text-sm">تم حفظ الفاتورة وإتمام المعاملة بنجاح!</h4>
                    </div>
                    <div className="bg-slate-950 p-4.5 rounded-2xl font-mono text-[10px] space-y-2 border border-slate-900 text-right">
                      <p className="text-center font-bold text-xs text-white">إيصال مبيعات مبسط</p>
                      <p className="text-center text-slate-400 font-mono mt-1">الفاتورة: {posCheckoutSuccess.invoiceNumber}</p>
                      <p className="text-center text-slate-500 font-mono">التاريخ: {new Date(posCheckoutSuccess.createdAt).toLocaleString("ar-SA")}</p>
                      <div className="border-t border-dashed border-slate-800 my-2.5"></div>
                      {posCheckoutSuccess.items?.map((it: any) => (
                        <div key={it.id} className="flex justify-between text-slate-300 font-sans text-right">
                          <span className="font-mono text-left">${(Number(it.unitPrice) * Number(it.quantity)).toFixed(2)}</span>
                          <span>{it.quantity}x {it.variant?.sku || "صنف منتج"}</span>
                        </div>
                      ))}
                      <div className="border-t border-dashed border-slate-800 my-2.5"></div>
                      <div className="flex justify-between text-white font-extrabold text-xs">
                        <span className="font-mono text-left">${Number(posCheckoutSuccess.grandTotal).toFixed(2)}</span>
                        <span>المجموع (شامل الضريبة)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span className="font-mono text-left">${Number(posCheckoutSuccess.amountPaid).toFixed(2)}</span>
                        <span>المبلغ المدفوع</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPosCheckoutSuccess(null)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      إغلاق إيصال العرض
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 5. SALES INVOICES */}
          {activeTab === "invoices" && (
            <div className="space-y-5 text-right">
              <div>
                <h2 className="text-xl font-black text-white">سجل فواتير المبيعات الصادرة</h2>
                <p className="text-xs text-slate-400 mt-1">مراجعة وتتبع جميع الفواتير الصادرة للعملاء وتاريخ السداد الخاص بكل عملية</p>
              </div>

              {/* INVOICES TABLE */}
              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-sm">
                {invoices.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-20">لا توجد فواتير مبيعات مسجلة حتى الآن.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900/40 text-slate-300 border-b border-slate-900">
                        <tr>
                          <th className="px-5 py-4 font-bold">رقم الفاتورة والتاريخ</th>
                          <th className="px-5 py-4 font-bold">العميل المرتبط</th>
                          <th className="px-5 py-4 font-bold">طريقة الدفع</th>
                          <th className="px-5 py-4 font-bold text-left">قيمة الضريبة (15%)</th>
                          <th className="px-5 py-4 font-bold text-left">المجموع الكلي</th>
                          <th className="px-5 py-4 font-bold text-center">حالة السداد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="px-5 py-3.5">
                              <span className="font-mono font-bold text-slate-200 block text-sm">{inv.invoiceNumber}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                                {new Date(inv.createdAt).toLocaleString("ar-SA")}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-300 font-semibold">
                              {inv.customer?.name || "عميل نقدي عابر"}
                            </td>
                            <td className="px-5 py-3.5 text-slate-400 font-bold">
                              {inv.paymentMethod === "CARD" ? "مدى / بطاقة" : inv.paymentMethod === "CASH" ? "نقدي" : "تحويل بنكي"}
                            </td>
                            <td className="px-5 py-3.5 text-left font-mono text-slate-300">${Number(inv.taxTotal).toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-left font-extrabold text-white text-sm font-mono">${Number(inv.grandTotal).toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                              }`}>
                                {inv.status === "PAID" ? "مدفوعة ومسواة" : "غير مدفوعة"}
                              </span>
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

          {/* TAB CONTENT: 6. EXPENSES FINANCE */}
          {activeTab === "expenses" && (
            <div className="space-y-5 text-right">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">إدارة مصروفات المنشأة والخزينة</h2>
                  <p className="text-xs text-slate-400 mt-1">تتبع التدفقات النقدية الخارجة، أجور الموظفين، تكاليف الإيجار وفواتير الخدمات العامة</p>
                </div>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-500/10 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل مصروف جديد</span>
                </button>
              </div>

              {/* EXPENSES LOG TABLE */}
              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-sm">
                {expenses.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-20">لا توجد مصروفات مسجلة حتى الآن.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900/40 text-slate-300 border-b border-slate-900">
                        <tr>
                          <th className="px-5 py-4 font-bold">تاريخ الصرف</th>
                          <th className="px-5 py-4 font-bold">التصنيف</th>
                          <th className="px-5 py-4 font-bold">الوصف والبيان التفصيلي</th>
                          <th className="px-5 py-4 font-bold text-left">القيمة المالية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="px-5 py-3.5 text-slate-300 font-mono">
                              {new Date(exp.expenseDate).toLocaleDateString("ar-SA")}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-block text-[9px] font-bold uppercase bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-md font-sans">
                                {exp.category === "UTILITIES" ? "خدمات ومرافق" : 
                                 exp.category === "RENT" ? "إيجارات" : 
                                 exp.category === "MARKETING" ? "تسويق وإعلانات" : 
                                 exp.category === "SALARIES" ? "أجور ورواتب" : "شحن ولوجستيات"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-400 font-medium">{exp.description || "بدون بيان إضافي"}</td>
                            <td className="px-5 py-3.5 text-left font-extrabold text-rose-400 text-sm font-mono">${Number(exp.amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- MODAL DIALOGS --- */}

          {/* ADD CUSTOMER MODAL */}
          {showAddCustomer && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200 text-right">
                <button onClick={() => setShowAddCustomer(false)} className="absolute top-4 left-4 text-slate-400 hover:text-white cursor-pointer text-sm font-bold">✕</button>
                <h3 className="text-lg font-black text-white mb-5 border-b border-slate-950 pb-3 text-right">تسجيل ملف عميل جديد (CRM)</h3>
                <form onSubmit={createCustomer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-right">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">الاسم الكامل / اسم الشركة</label>
                      <input
                        type="text"
                        required
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-right"
                        placeholder="شركة أحمد اللوجستية"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-right"
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-right">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">رقم الهاتف</label>
                      <input
                        type="text"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-left font-mono"
                        placeholder="+966500000000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">الرقم الضريبي</label>
                      <input
                        type="text"
                        value={newCustTax}
                        onChange={(e) => setNewCustTax(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono text-left"
                        placeholder="300012345600003"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">الحد الائتماني ($)</label>
                      <input
                        type="number"
                        value={newCustLimit}
                        onChange={(e) => setNewCustLimit(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-right"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">عنوان التوصيل والشحن</label>
                    <input
                      type="text"
                      value={newCustShipping}
                      onChange={(e) => setNewCustShipping(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-right"
                      placeholder="شارع العليا العام، الرياض، المملكة العربية السعودية"
                    />
                  </div>

                  <div className="text-right">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">عنوان الفوترة</label>
                    <input
                      type="text"
                      value={newCustBilling}
                      onChange={(e) => setNewCustBilling(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-right"
                      placeholder="نفس عنوان التوصيل الرئيسي"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-500/10 active:scale-[0.98]"
                  >
                    تأكيد تسجيل ملف العميل في النظام
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD PRODUCT MODAL */}
          {showAddProduct && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200 text-right">
                <button onClick={() => setShowAddProduct(false)} className="absolute top-4 left-4 text-slate-400 hover:text-white cursor-pointer text-sm font-bold">✕</button>
                <h3 className="text-lg font-black text-white mb-5 border-b border-slate-950 pb-3 text-right">إدراج منتج جديد في دليل المنشأة</h3>
                <form onSubmit={createProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-right">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">اسم السلعة / المنتج</label>
                      <input
                        type="text"
                        required
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-right"
                        placeholder="شاشة كمبيوتر 4K"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">العلامة التجارية / الشركة المصنعة</label>
                      <input
                        type="text"
                        value={newProdBrand}
                        onChange={(e) => setNewProdBrand(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-right"
                        placeholder="سامسونج"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">الوصف التفصيلي</label>
                    <textarea
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none h-16 resize-none text-right"
                      placeholder="اكتب تفاصيل ومواصفات المنتج هنا..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-4 border border-slate-900 rounded-2xl text-right">
                    <div className="col-span-2">
                      <h4 className="text-[10px] uppercase font-black text-indigo-400 mb-1 text-right">خصائص وتكلفة الصنف الأول للمنتج</h4>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-right">رمز SKU المخزني (فريد)</label>
                      <input
                        type="text"
                        required
                        value={newProdSKU}
                        onChange={(e) => setNewProdSKU(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono text-left"
                        placeholder="MON-4K-BLK"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-right">رمز الباركود (UPC/EAN)</label>
                      <input
                        type="text"
                        value={newProdBarcode}
                        onChange={(e) => setNewProdBarcode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono text-left"
                        placeholder="8806090000000"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-right">سعر البيع الافتراضي ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none text-left font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-right">تكلفة الشراء الأصلية ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newProdCost}
                        onChange={(e) => setNewProdCost(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none text-left font-mono"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-right">خاصية مميزة للمنتج (مثال: لون أو حجم)</label>
                      <input
                        type="text"
                        value={newProdColor}
                        onChange={(e) => setNewProdColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-right"
                        placeholder="أسود داكن"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-500/10 active:scale-[0.98]"
                  >
                    تأكيد إدراج المنتج في دليل المخزن
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD EXPENSE MODAL */}
          {showAddExpense && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200 text-right">
                <button onClick={() => setShowAddExpense(false)} className="absolute top-4 left-4 text-slate-400 hover:text-white cursor-pointer text-sm font-bold">✕</button>
                <h3 className="text-lg font-black text-white mb-5 border-b border-slate-950 pb-3 text-rose-500 text-right">تقييد وقيد مصروفات المنشأة</h3>
                <form onSubmit={createExpense} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-right">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">المبلغ المالي ($)</label>
                      <input
                        type="number"
                        required
                        value={newExpAmount}
                        onChange={(e) => setNewExpAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-left font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">تصنيف المصروف</label>
                      <select
                        value={newExpCategory}
                        onChange={(e) => setNewExpCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 py-2.5 text-xs text-white outline-none font-bold cursor-pointer text-right"
                      >
                        <option value="UTILITIES">خدمات ومرافق (كهرباء/ماء/هاتف)</option>
                        <option value="RENT">إيجار المكاتب والمستودعات</option>
                        <option value="MARKETING">تسويق وإعلانات رقمية</option>
                        <option value="SALARIES">رواتب وأجور الموظفين</option>
                        <option value="LOGISTICS">شحن ونقل ولوجستيات</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">وصف وبيان الصرف</label>
                    <textarea
                      required
                      value={newExpDesc}
                      onChange={(e) => setNewExpDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none h-20 resize-none text-right"
                      placeholder="اكتب هنا ما يوضح سبب صرف الميزانية (مثال: فاتورة كهرباء مستودع الرياض لشهر يونيو)..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer shadow-md shadow-rose-500/10 active:scale-[0.98]"
                  >
                    قيد العملية وخصمها من الميزانية
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD WAREHOUSE MODAL */}
          {showAddWarehouse && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200 text-right">
                <button onClick={() => setShowAddWarehouse(false)} className="absolute top-4 left-4 text-slate-400 hover:text-white cursor-pointer text-sm font-bold">✕</button>
                <h3 className="text-lg font-black text-white mb-5 border-b border-slate-950 pb-3 text-right">إدراج مستودع / فرع لوجستي جديد</h3>
                <form onSubmit={createWarehouse} className="space-y-4">
                  <div className="text-right">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">اسم المستودع / الفرع</label>
                    <input
                      type="text"
                      required
                      value={newWhName}
                      onChange={(e) => setNewWhName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-right"
                      placeholder="مستودع المنطقة الوسطى الرئيسي"
                    />
                  </div>

                  <div className="text-right">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">العنوان الجغرافي بالتفصيل</label>
                    <input
                      type="text"
                      value={newWhAddress}
                      onChange={(e) => setNewWhAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-right"
                      placeholder="المنطقة الصناعية الثانية، مخرج 15، الرياض"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-500/10 active:scale-[0.98]"
                  >
                    تأكيد قيد المستودع في النظام
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STOCK ADJUSTMENT / INGEST MODAL */}
          {showAdjustStock && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200 text-right">
                <button onClick={() => setShowAdjustStock(false)} className="absolute top-4 left-4 text-slate-400 hover:text-white cursor-pointer text-sm font-bold">✕</button>
                <h3 className="text-lg font-black text-white mb-5 border-b border-slate-950 pb-3 text-right">تسوية ورفع كميات المخزون المتوفرة</h3>
                <form onSubmit={adjustStock} className="space-y-4">
                  <div className="text-right">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">المستودع / الفرع المستهدف</label>
                    <select
                      required
                      value={adjWarehouseId}
                      onChange={(e) => setAdjWarehouseId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 py-2.5 text-xs text-white outline-none font-bold cursor-pointer text-right"
                    >
                      <option value="">اختر مستودع التخزين...</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-right">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">الصنف والرمز المخزني المستهدف (SKU)</label>
                    <select
                      required
                      value={adjVariantId}
                      onChange={(e) => setAdjVariantId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 py-2.5 text-xs text-white outline-none font-bold cursor-pointer text-right"
                    >
                      <option value="">اختر رمز SKU الصنف...</option>
                      {products.map((p) =>
                        p.variants?.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {p.name} - SKU: {v.sku}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="text-right">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 text-right">الكمية الجديدة المراد إضافتها (وحدة)</label>
                    <input
                      type="number"
                      required
                      value={adjQty}
                      onChange={(e) => setAdjQty(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none text-left font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-500/10 active:scale-[0.98]"
                  >
                    تأكيد إدخال وتسوية الكميات في المستودع
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
