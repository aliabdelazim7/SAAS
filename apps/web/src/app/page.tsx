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
  const API_BASE_URL = apiUrl;

  // --- AUTH STATE ---
  const [token, setToken] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authLoading, setAuthLoading] = useState(false);

  // Onboarding Wizard step: 1 (Email & Password), 2 (Email Verification Screen), 3 (Business Data), 4 (Provisioning Simulation)
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);
  const [provisioningProgress, setProvisioningProgress] = useState(0);
  const [provisioningMsg, setProvisioningMsg] = useState("");
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [userEnteredCode, setUserEnteredCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

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
      // Check if it's the first time setup using localStorage
      if (isFirstTimeSetup) {
        setShowWelcomeModal(true);
      }
    }
  }, [token]);

  // Handle system provisioning animation flow
  useEffect(() => {
    if (authMode === "register" && regStep === 4) {
      setProvisioningProgress(5);
      setProvisioningMsg("جاري الاتصال بقاعدة البيانات السحابية وتجهيز البيئة الحية...");
      
      const interval = setInterval(() => {
        setProvisioningProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          const nextVal = prev + Math.floor(Math.random() * 15) + 5;
          if (nextVal < 35) {
            setProvisioningMsg("جاري تأسيس هيكل الجداول وربط مستودعات البيانات...");
          } else if (nextVal < 75) {
            const indText = regIndustryType === "RETAIL" ? "تجارة التجزئة" : 
                            regIndustryType === "GARAGE" ? "ورش صيانة السيارات" : 
                            regIndustryType === "TAILOR" ? "مشاغل الخياطة وحياكة الأقمشة" : "تجارة الجملة";
            setProvisioningMsg(`تحميل التهيئة الإعدادية المخصصة لقطاع (${indText})...`);
          } else {
            setProvisioningMsg(`ربط مساحة العمل بنطاقك السحابي الخاص: ${regSubdomain}.crmsaas.app...`);
          }
          return nextVal > 95 ? 95 : nextVal;
        });
      }, 500);

      // Perform registration action once provisioning finishes simulation
      const timeout = setTimeout(async () => {
        clearInterval(interval);
        setProvisioningProgress(100);
        setProvisioningMsg("اكتمل تجهيز النظام! جاري تشغيل مساحة العمل الخاصة بك...");
        
        // Execute registration api call
        await executeRegisterAPI();
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [regStep]);

  // Decode basic tenant/user claims from standard JWT payload part
  const decodeTenantFromToken = (jwtToken: string) => {
    try {
      const payloadPart = jwtToken.split(".")[1];
      if (payloadPart) {
        const decoded = JSON.parse(atob(payloadPart));
        setTenantInfo(decoded);
        
        // Check local storage to see if welcome modal was already shown for this subdomain
        const onboardedKey = `onboarded_${decoded.subdomain}`;
        if (localStorage.getItem(onboardedKey)) {
          setShowWelcomeModal(false);
          setIsFirstTimeSetup(false);
        }
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

  const executeRegisterAPI = async () => {
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
      setIsFirstTimeSetup(true);
      setToken(data.accessToken);
      decodeTenantFromToken(data.accessToken);
      showTemporarySuccess("تم تأسيس وتهيئة نظامك بنجاح! أهلاً بك.");
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء الاتصال بالخادم وتجهيز النظام.");
      setRegStep(3); // return back to step 3 so they can edit subdomain/details
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
    setIsFirstTimeSetup(false);
    setShowWelcomeModal(false);
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

  const getIndustryNameArabic = (type: string) => {
    switch (type) {
      case "RETAIL": return "تجارة التجزئة";
      case "GARAGE": return "صيانة السيارات";
      case "TAILOR": return "مشغل الخياطة والحياكة";
      case "WHOLESALE": return "تجارة الجملة";
      default: return type;
    }
  };

  // --- RENDER COMPONENT ---
  if (!token) {
    // ONBOARDING & LOGIN SCREEN (LIGHT THEME)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-16 px-6 sm:px-8 lg:px-12 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
        {/* Abstract shapes for premium light mode visual background */}
        <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-50/70 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full bg-violet-50/70 blur-[130px] pointer-events-none"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 text-center">
          <div className="flex justify-center items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Building className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
              أنتي غرافيتي ERP
            </span>
          </div>
          <p className="mt-4 text-slate-500 text-base font-bold">
            {authMode === "login" ? "سجل الدخول لإدارة منشأتك وعملياتك" : "سجل حسابك لتأسيس نظام إدارة وتخطيط متكامل لشركتك"}
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
          <div className="bg-white border border-slate-200/80 py-10 px-8 sm:px-12 shadow-xl shadow-slate-100 rounded-[32px] transition-all duration-300">
            {errorMsg && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 p-4.5 rounded-2xl flex items-start gap-3 text-base text-right font-medium animate-pulse">
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-600 p-4.5 rounded-2xl flex items-start gap-3 text-base text-right font-medium">
                <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {authMode === "login" ? (
              <form className="space-y-6 text-right" onSubmit={handleLogin}>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 text-right">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 text-base transition-all focus:outline-none text-right font-medium"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 text-right">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 text-base transition-all focus:outline-none text-right font-medium"
                    placeholder="••••••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-4 flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-2xl text-base font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {authLoading ? <Loader className="w-6 h-6 animate-spin" /> : "تسجيل الدخول للمنظومة"}
                </button>
              </form>
            ) : (
              /* MULTI-STEP ONBOARDING WIZARD */
              <div className="space-y-6">
                {/* Steps visual indicators */}
                <div className="flex items-center justify-between max-w-md mx-auto mb-8 dir-ltr">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${regStep >= 1 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>1</div>
                    <span className="text-xs font-bold text-slate-500 mt-2">الحساب</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${regStep >= 2 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${regStep >= 2 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>2</div>
                    <span className="text-xs font-bold text-slate-500 mt-2">التفعيل</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${regStep >= 3 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${regStep >= 3 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>3</div>
                    <span className="text-xs font-bold text-slate-500 mt-2">البيانات</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${regStep >= 4 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${regStep >= 4 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>4</div>
                    <span className="text-xs font-bold text-slate-500 mt-2">التهيئة</span>
                  </div>
                </div>

                {/* Step 1: Email and Password Form */}
                {regStep === 1 && (
                  <form
                    className="space-y-6 text-right"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const code = Math.floor(100000 + Math.random() * 900000).toString();
                      setVerificationCode(code);
                      setUserEnteredCode("");
                      setCodeError(null);
                      setRegStep(2);
                    }}
                  >
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 text-base transition-all focus:outline-none text-right font-medium"
                        placeholder="name@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور (12 خانة على الأقل)</label>
                      <input
                        type="password"
                        required
                        minLength={12}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 text-base transition-all focus:outline-none text-right font-medium"
                        placeholder="••••••••••••"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full mt-4 flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl text-base font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      التالي
                    </button>
                  </form>
                )}

                {/* Step 2: Email Verification Notice */}
                {regStep === 2 && (
                  <div className="text-center space-y-6 py-4">
                    {/* Simulated Inbox Banner */}
                    <div className="bg-indigo-50/80 border border-indigo-100/80 rounded-2xl p-5 text-right flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span>صندوق الوارد (البريد الإلكتروني التجريبي)</span>
                      </div>
                      <p className="text-slate-600 text-xs font-bold leading-relaxed">
                        مرحباً! لتسريع تجربتك وتخطي تأخير وصول الرسائل الإلكترونية، قمنا بتوليد رمز التفعيل لبريدك الخاص <span className="font-mono text-indigo-600">{regEmail}</span> مباشرة أدناه:
                      </p>
                      <div className="mt-2 flex items-center justify-between bg-white border border-indigo-150 rounded-xl px-4 py-2.5 shadow-inner">
                        <span className="text-slate-500 font-bold text-xs">رمز تفعيل الحساب:</span>
                        <span className="text-2xl font-black text-indigo-600 tracking-widest font-mono select-all">{verificationCode}</span>
                      </div>
                    </div>

                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle className="w-8 h-8 animate-pulse" />
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-slate-900">تأكيد الحساب والبريد الإلكتروني</h3>
                    
                    <div className="text-right max-w-sm mx-auto space-y-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">أدخل رمز التفعيل المكون من 6 أرقام</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={userEnteredCode}
                        onChange={(e) => {
                          setUserEnteredCode(e.target.value);
                          setCodeError(null);
                        }}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-center tracking-widest text-xl font-black font-mono text-slate-800 focus:outline-none transition-all"
                        placeholder="000000"
                      />
                      {codeError && (
                        <p className="text-rose-500 text-xs font-bold mt-1 text-center animate-bounce">{codeError}</p>
                      )}
                    </div>

                    <div className="flex gap-4 max-w-sm mx-auto pt-4">
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
                      >
                        رجوع
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (userEnteredCode.trim() === verificationCode) {
                            setRegStep(3);
                          } else {
                            setCodeError("رمز التفعيل غير صحيح، يرجى المحاولة مرة أخرى.");
                          }
                        }}
                        className="flex-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer"
                      >
                        تحقق ومتابعة
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Business Setup Form */}
                {regStep === 3 && (
                  <form className="space-y-5 text-right" onSubmit={(e) => { e.preventDefault(); setRegStep(4); }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الأول</label>
                        <input
                          type="text"
                          required
                          value={regFirstName}
                          onChange={(e) => setRegFirstName(e.target.value)}
                          className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-slate-800 text-sm transition-all focus:outline-none text-right font-medium"
                          placeholder="أحمد"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">اسم العائلة</label>
                        <input
                          type="text"
                          required
                          value={regLastName}
                          onChange={(e) => setRegLastName(e.target.value)}
                          className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-slate-800 text-sm transition-all focus:outline-none text-right font-medium"
                          placeholder="علي"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">اسم البيزنيس (اسم منشأتك الخاص)</label>
                      <p className="text-xs text-slate-400 mb-2">هذا هو الاسم الذي سيظهر في لوحة التحكم والفواتير وإيصالات المبيعات الخاصة بك.</p>
                      <input
                        type="text"
                        required
                        value={regBusinessName}
                        onChange={(e) => setRegBusinessName(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-slate-800 text-sm transition-all focus:outline-none text-right font-medium"
                        placeholder="بيزنيس الباز للمبيعات"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">مجال العمل / النشاط</label>
                        <select
                          value={regIndustryType}
                          onChange={(e) => setRegIndustryType(e.target.value)}
                          className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-3 py-3.5 text-slate-800 text-sm transition-all focus:outline-none font-bold"
                        >
                          <option value="RETAIL">قطاع التجزئة (سوبرماركت/ملابس)</option>
                          <option value="GARAGE">ورش صيانة السيارات</option>
                          <option value="TAILOR">مشغل خياطة وحياكة</option>
                          <option value="WHOLESALE">تجارة الجملة</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">النطاق الفرعي (رابط الدخول)</label>
                        <input
                          type="text"
                          required
                          value={regSubdomain}
                          onChange={(e) => setRegSubdomain(e.target.value)}
                          className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-slate-800 text-sm transition-all focus:outline-none font-mono text-left font-bold"
                          placeholder="al-baz"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">باقة الاشتراك</label>
                      <select
                        value={regPlanName}
                        onChange={(e) => setRegPlanName(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-3 py-3.5 text-slate-800 text-sm transition-all focus:outline-none font-bold"
                      >
                        <option value="BUSINESS">خطة الأعمال الاحترافية (موصى بها)</option>
                        <option value="STARTER">الخطة الأساسية الفردية</option>
                        <option value="PROFESSIONAL">خطة المؤسسات والشركات الكبرى</option>
                      </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setRegStep(2)}
                        className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
                      >
                        رجوع
                      </button>
                      <button
                        type="submit"
                        className="flex-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg transition-all cursor-pointer"
                      >
                        إنشاء النظام والبدء
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 4: System Provisioning Animation Screen */}
                {regStep === 4 && (
                  <div className="text-center space-y-8 py-10">
                    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                      {/* Animated outer ring */}
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-4 border-violet-100 border-b-violet-500 animate-spin animate-duration-1000"></div>
                      <Building className="w-10 h-10 text-indigo-600 relative z-10" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-slate-900">جاري إعداد نظامك السحابي الخاص</h3>
                      <p className="text-slate-600 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                        يرجى الانتظار للحظات بينما ننشئ مساحة العمل الآمنة لقاعدة بيانات Supabase ونثبّت إعدادات التكوين المخصصة لشركتك.
                      </p>
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-300" style={{ width: `${provisioningProgress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 font-bold font-mono">
                        <span>{provisioningProgress}%</span>
                        <span>{provisioningMsg}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setRegStep(1);
                  setErrorMsg(null);
                }}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                {authMode === "login" ? "ليس لديك مساحة عمل؟ أنشئ حساباً الآن" : "لديك حساب للمنشأة؟ سجل الدخول هنا"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD SCREEN (LIGHT THEME) ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Background decoration elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-100/10 blur-[130px] pointer-events-none"></div>

      {/* HEADERBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            {/* Show user's Business Name specifically, not the SaaS name! */}
            <h1 className="font-extrabold text-lg leading-tight text-slate-900">
              {tenantInfo?.businessName || regBusinessName || "مساحة عمل المنشأة"}
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="font-mono text-xs">{tenantInfo?.subdomain}.crmsaas.app</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs ms-1">
                {getIndustryNameArabic(tenantInfo?.industryType || regIndustryType)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchAllData}
            disabled={dataLoading}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all cursor-pointer text-slate-700 bg-white shadow-sm"
          >
            {dataLoading ? (
              <Loader className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <Warehouse className="w-4.5 h-4.5 text-indigo-500" />
            )}
            <span>مزامنة البيانات</span>
          </button>
          
          <div className="hidden sm:block text-left text-end">
            <p className="text-sm font-bold text-slate-800">
              {tenantInfo?.email}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 justify-end mt-0.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>نشط سحابياً</span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="p-3 border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 rounded-xl transition-all cursor-pointer shadow-sm"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* DASHBOARD BODY LAYOUT */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* SIDEBAR NAVIGATION - Renders on the RIGHT side in RTL */}
        <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-l border-slate-200 p-5 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
          <div className="hidden lg:block px-4 py-2 mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">لوحات التحكم والمحاسبة</p>
          </div>
          
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "dashboard"
                ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-500 font-extrabold shadow-sm shadow-indigo-100/50"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <LayoutDashboard className="w-5.5 h-5.5 shrink-0" />
            <span>الرئيسية والإحصاءات</span>
          </button>
          
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "customers"
                ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-500 font-extrabold shadow-sm shadow-indigo-100/50"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Users className="w-5.5 h-5.5 shrink-0" />
            <span>إدارة العملاء (CRM)</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "products"
                ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-500 font-extrabold shadow-sm shadow-indigo-100/50"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Package className="w-5.5 h-5.5 shrink-0" />
            <span>دليل المنتجات والمخزن</span>
          </button>

          <button
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "pos"
                ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500 font-extrabold shadow-sm shadow-emerald-100/50"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <ShoppingCart className="w-5.5 h-5.5 shrink-0 text-emerald-500" />
            <span className="text-emerald-600">فاتورة الكاشير (POS)</span>
          </button>

          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "invoices"
                ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-500 font-extrabold shadow-sm shadow-indigo-100/50"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <FileText className="w-5.5 h-5.5 shrink-0" />
            <span>سجل الفواتير الصادرة</span>
          </button>

          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold transition-all shrink-0 cursor-pointer text-right ${
              activeTab === "expenses"
                ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-500 font-extrabold shadow-sm shadow-indigo-100/50"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <DollarSign className="w-5.5 h-5.5 shrink-0" />
            <span>المصروفات والخزينة</span>
          </button>
        </aside>

        {/* MAIN VIEW AREA */}
        <main className="flex-1 p-6 md:p-8 relative">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-8 bg-rose-50 border border-rose-200 text-rose-700 p-5 rounded-3xl flex items-start gap-4 text-base relative animate-pulse text-right shadow-sm">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">فشل الإجراء: </span>
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-700 p-5 rounded-3xl flex items-start gap-4 text-base text-right shadow-sm">
              <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">نجاح العملية: </span>
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* LOADING STATE COVER */}
          {dataLoading && customers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-500 text-base font-bold">جاري جلب ومزامنة بيانات المنشأة مع قاعدة Supabase...</p>
            </div>
          )}

          {/* TAB CONTENT: 1. DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* METRIC CARD GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border-t-4 border-indigo-500 border-x border-b border-slate-200/80 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-300 transition-all duration-300 text-right shadow-sm shadow-slate-100">
                  <div className="absolute top-0 left-0 w-28 h-28 bg-indigo-50 rounded-full -translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">إجمالي المبيعات</span>
                    <Coins className="w-6 h-6 text-indigo-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 mt-3 font-mono">${totalSales.toFixed(2)}</p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-indigo-600 font-bold">
                    <TrendingUp className="w-4 h-4" />
                    <span>مباشر من نقاط البيع</span>
                  </div>
                </div>

                <div className="bg-white border-t-4 border-rose-500 border-x border-b border-slate-200/80 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-300 transition-all duration-300 text-right shadow-sm shadow-slate-100">
                  <div className="absolute top-0 left-0 w-28 h-28 bg-rose-50 rounded-full -translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">إجمالي المصروفات</span>
                    <DollarSign className="w-6 h-6 text-rose-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 mt-3 font-mono">${totalExpenses.toFixed(2)}</p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 font-bold">
                    <span>المصاريف والتشغيل العام</span>
                  </div>
                </div>

                <div className="bg-white border-t-4 border-emerald-500 border-x border-b border-slate-200/80 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-300 transition-all duration-300 text-right shadow-sm shadow-slate-100">
                  <div className="absolute top-0 left-0 w-28 h-28 bg-emerald-50 rounded-full -translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">صافي الأرباح</span>
                    <Coins className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className={`text-3xl font-black mt-3 font-mono ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    ${netProfit.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600 font-bold">
                    <span>الهامش المالي المتبقي</span>
                  </div>
                </div>

                <div className="bg-white border-t-4 border-amber-500 border-x border-b border-slate-200/80 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-300 transition-all duration-300 text-right shadow-sm shadow-slate-100">
                  <div className="absolute top-0 left-0 w-28 h-28 bg-amber-550 rounded-full -translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">كمية المخزون</span>
                    <Package className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 mt-3 font-mono">{totalStockQty} وحدة</p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-amber-600 font-bold">
                    <span>موزعة على {warehouses.length} مستودع</span>
                  </div>
                </div>
              </div>

              {/* SECONDARY INFO BLOCK: WAREHOUSES & RECENT ACTIVITY */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* WAREHOUSE REGISTRY SUMMARY */}
                <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-1 space-y-5 shadow-sm text-right">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
                      <Warehouse className="w-5.5 h-5.5 text-indigo-500" />
                      <span>المستودعات والفروع</span>
                    </h3>
                    <button
                      onClick={() => setShowAddWarehouse(true)}
                      className="p-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:text-indigo-600 rounded-xl text-indigo-500 transition-all cursor-pointer"
                      title="إضافة مستودع جديد"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {warehouses.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-10 font-medium">لا توجد فروع مسجلة حالياً. أضف مستودعاً لتسجيل المخزون.</p>
                  ) : (
                    <div className="space-y-3">
                      {warehouses.map((wh) => (
                        <div key={wh.id} className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex items-center justify-between hover:border-slate-200 transition-colors shadow-sm">
                          <div>
                            <p className="text-sm font-extrabold text-slate-900">{wh.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{wh.address || "لم يتم تسجيل تفاصيل العنوان"}</p>
                          </div>
                          <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg">
                            نشط
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowAdjustStock(true)}
                    className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-bold rounded-2xl transition-all cursor-pointer text-center block shadow-sm"
                  >
                    توريد وتسوية كميات المخزون
                  </button>
                </div>

                {/* RECENT INVOICES CHECKOUT LOG */}
                <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-2 space-y-5 shadow-sm text-right">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
                      <FileText className="w-5.5 h-5.5 text-indigo-500" />
                      <span>آخر العمليات وفواتير المبيعات</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab("invoices")}
                      className="text-sm font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      عرض السجل بالكامل
                    </button>
                  </div>

                  {invoices.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-16 font-medium">لا توجد مبيعات مسجلة حتى الآن.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="pb-4 font-extrabold">رقم الفاتورة</th>
                            <th className="pb-4 font-extrabold">العميل</th>
                            <th className="pb-4 font-extrabold">طريقة السداد</th>
                            <th className="pb-4 font-extrabold text-left">المجموع الكلي</th>
                            <th className="pb-4 font-extrabold text-center">حالة السداد</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {invoices.slice(0, 5).map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4.5 font-mono text-slate-900 font-extrabold text-sm">{inv.invoiceNumber}</td>
                              <td className="py-4.5 text-slate-800 font-semibold">{inv.customer?.name || "عميل نقدي عابر"}</td>
                              <td className="py-4.5 text-xs font-bold text-slate-500">
                                {inv.paymentMethod === "CARD" ? "مدى / بطاقة" : inv.paymentMethod === "CASH" ? "نقدي" : "تحويل بنكي"}
                              </td>
                              <td className="py-4.5 text-left font-black text-slate-900 font-mono text-base">${Number(inv.grandTotal).toFixed(2)}</td>
                              <td className="py-4.5 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  inv.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
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
            <div className="space-y-6 text-right">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">دليل عملاء المنشأة (CRM)</h2>
                  <p className="text-sm text-slate-500 mt-1">تتبع وتسجيل حسابات العملاء، الأرصدة المستحقة، وحدود الائتمان المسموحة</p>
                </div>
                <button
                  onClick={() => setShowAddCustomer(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>تسجيل عميل جديد</span>
                </button>
              </div>

              {/* CUSTOMERS LISTING TABLE */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                {customers.length === 0 ? (
                  <p className="text-base text-slate-400 text-center py-24 font-bold">لا يوجد عملاء مسجلين حالياً. اضغط على "تسجيل عميل جديد" للبدء.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-550 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4.5 font-extrabold">الاسم والملف التعريفى</th>
                          <th className="px-6 py-4.5 font-extrabold">معلومات الاتصال</th>
                          <th className="px-6 py-4.5 font-extrabold">الرقم الضريبي</th>
                          <th className="px-6 py-4.5 font-extrabold">الحد الائتماني</th>
                          <th className="px-6 py-4.5 font-extrabold">الرصيد المستحق</th>
                          <th className="px-6 py-4.5 font-extrabold">تاريخ التسجيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customers.map((cust) => (
                          <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4.5">
                              <span className="font-extrabold text-slate-900 text-base block">{cust.name}</span>
                              <span className="text-xs text-slate-400 font-mono block mt-1">{cust.id}</span>
                            </td>
                            <td className="px-6 py-4.5 space-y-1">
                              <span className="block text-slate-800 font-medium">{cust.email || "لم يسجل بريد"}</span>
                              <span className="block text-slate-500 text-xs font-mono">{cust.phone || "بدون رقم جوال"}</span>
                            </td>
                            <td className="px-6 py-4.5 font-mono text-slate-700 font-medium">{cust.taxNumber || "—"}</td>
                            <td className="px-6 py-4.5 font-extrabold text-slate-900 font-mono text-base">${Number(cust.creditLimit).toFixed(2)}</td>
                            <td className="px-6 py-4.5">
                              <span className={`font-black font-mono text-base ${Number(cust.outstandingBalance) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                                ${Number(cust.outstandingBalance).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 text-slate-600 font-medium">
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
            <div className="space-y-6 text-right">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">دليل المنتجات والمستودع</h2>
                  <p className="text-sm text-slate-500 mt-1">عرض وتصنيف السلع المتوفرة، تكلفة الشراء، أسعار البيع وتتبع الباركود (UPC)</p>
                </div>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>إضافة منتج جديد</span>
                </button>
              </div>

              {/* PRODUCTS LISTING */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {products.length === 0 ? (
                  <p className="text-base text-slate-400 text-center py-24 lg:col-span-2 font-bold">دليل المنتجات خالي حالياً. يرجى تسجيل أول منتج للمنشأة.</p>
                ) : (
                  products.map((p) => (
                    <div key={p.id} className="bg-white border border-slate-200 p-6 rounded-[32px] space-y-5 hover:border-slate-300 hover:shadow-md transition-all duration-300 text-right">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                            {p.brand || "بدون علامة تجارية"}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">الرمز التعريفى: {p.id.slice(0, 8)}</span>
                        </div>
                        <h3 className="font-extrabold text-lg text-slate-900 mt-3">{p.name}</h3>
                        <p className="text-sm text-slate-600 mt-1.5 font-medium leading-relaxed">{p.description || "لم يسجل وصف تفصيلي للمنتج."}</p>
                      </div>

                      {/* Variants and stock listing */}
                      <div className="border-t border-slate-100 pt-4.5 space-y-3.5 text-right">
                        <h4 className="text-sm font-extrabold text-slate-800">أكواد وأصناف المنتجات المسجلة (SKUs):</h4>
                        {p.variants?.map((v: any) => (
                          <div key={v.id} className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between text-sm gap-4">
                            <div className="space-y-1.5 text-right">
                              <p className="font-mono font-black text-indigo-600 text-right text-base">{v.sku}</p>
                              {v.barcode && (
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono justify-start font-medium">
                                  <QrCode className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span>{v.barcode}</span>
                                </p>
                              )}
                              <p className="text-xs text-slate-500 text-right font-medium">
                                {Object.keys(v.attributes || {}).map((k) => `${k}: ${v.attributes[k]}`).join(" | ") || "بدون خصائص إضافية"}
                              </p>
                            </div>

                            <div className="text-left shrink-0 space-y-1">
                              <p className="font-black text-slate-900 font-mono text-base">${Number(v.price).toFixed(2)}</p>
                              <p className="text-xs text-slate-500 font-mono font-bold">التكلفة: ${Number(v.costPrice).toFixed(2)}</p>
                              <div className="mt-2 flex justify-end flex-wrap gap-1">
                                {v.balances && v.balances.length > 0 ? (
                                  v.balances.map((bal: any) => (
                                    <span key={bal.id} className="inline-block text-xs font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg ms-1">
                                      {bal.warehouse?.name || "المستودع"}: {Number(bal.quantity)} وحدة
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs font-bold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg">
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
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 text-right">
              {/* RIGHT COLUMN: PRODUCTS BROWSER (3/5 width) - Rendered first in Arabic RTL flow */}
              <div className="lg:col-span-3 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                      <ShoppingCart className="w-6 h-6 text-emerald-500" />
                      <span>شاشة المحاسبة المباشرة (POS)</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">اختر أصناف المنتجات المتوفرة لتسجيل عملية بيع فوري وإصدار إيصال</p>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={posWarehouseId}
                      onChange={(e) => setPosWarehouseId(e.target.value)}
                      className="bg-white border border-slate-300 text-sm rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer shadow-sm"
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
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={posSearchQuery}
                    onChange={(e) => setPosSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-2xl pr-12 pl-4 py-4 text-base text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-slate-450 text-right font-medium"
                    placeholder="ابحث باسم السلعة، رقم الكود المخزني (SKU) أو الباركود..."
                  />
                </div>

                {/* PRODUCTS LIST */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1">
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
                            className={`bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/60 hover:shadow-md transition-all duration-200 group text-right shadow-sm ${
                              Number(stockBal) > 0 ? "cursor-pointer" : "opacity-45 cursor-not-allowed"
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">{p.brand || "عام"}</span>
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                                  Number(stockBal) > 0 ? "bg-emerald-550 text-white" : "bg-rose-50 text-rose-600"
                                }`}>
                                  {Number(stockBal) > 0 ? `المتوفر: ${Number(stockBal)}` : "غير متوفر"}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-sm text-slate-800 mt-3 group-hover:text-emerald-600 transition-colors leading-snug">{p.name}</h4>
                              <p className="text-xs text-slate-500 font-mono mt-1 text-right font-medium">SKU: {v.sku}</p>
                            </div>
                            <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100">
                              <span className="font-black text-base text-emerald-600 font-mono">${Number(v.price).toFixed(2)}</span>
                              {Number(stockBal) > 0 && (
                                <span className="text-xs text-emerald-650 font-extrabold flex items-center gap-1 bg-emerald-50 px-3.5 py-1.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all cursor-pointer">
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
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white border border-slate-200 rounded-[32px] p-6 flex flex-col min-h-[620px] justify-between shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-4 flex items-center justify-between">
                      <span>سلة المشتريات الحالية</span>
                      <span className="text-sm text-slate-500 font-bold">({posCart.length}) منتجات</span>
                    </h3>

                    {/* SELECT CUSTOMER */}
                    <div className="space-y-3 mt-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ربط المعاملة بعميل مسجل (اختياري)</label>
                        <select
                          value={posCustomerId}
                          onChange={(e) => setPosCustomerId(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-sm rounded-xl px-3.5 py-3 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
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
                      <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-sm space-y-3">
                        <ShoppingCart className="w-12 h-12 text-slate-300 animate-bounce" />
                        <p className="font-bold">السلة فارغة حالياً. اضغط على المنتجات المتوفرة لإضافتها.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-5 max-h-[260px] overflow-y-auto pr-1">
                        {posCart.map((item) => (
                          <div key={item.variantId} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-3 text-right">
                            <div className="min-w-0 text-right flex-1">
                              <p className="font-extrabold text-slate-800 text-sm truncate text-right">{item.productName}</p>
                              <p className="font-mono text-xs text-indigo-650 mt-1 text-right font-bold">{item.sku}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <button
                                onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-black text-sm cursor-pointer text-slate-700 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm font-black font-mono text-slate-800">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-black text-sm cursor-pointer text-slate-700 transition-colors"
                              >
                                +
                              </button>
                              <span className="font-black text-slate-900 text-sm ms-3 font-mono">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CHECKOUT TOTALS & BUTTON */}
                  <div className="border-t border-slate-100 pt-5 mt-5 space-y-4 text-right">
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>المجموع الفرعي (قبل الضريبة)</span>
                        <span className="font-bold font-mono text-slate-800">${calculateCartSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>ضريبة القيمة المضافة (15.00% VAT)</span>
                        <span className="font-bold font-mono text-slate-800">${calculateCartTax().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-extrabold text-base pt-3 border-t border-slate-100">
                        <span>المجموع النهائي الإجمالي</span>
                        <span className="text-emerald-600 font-black font-mono text-lg">${calculateCartTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">طريقة السداد</label>
                        <select
                          value={posPaymentMethod}
                          onChange={(e) => setPosPaymentMethod(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-xs rounded-xl px-3 py-3 focus:outline-none text-slate-800 focus:border-indigo-500 font-bold cursor-pointer"
                        >
                          <option value="CARD">بطاقة مدى / ائتمان</option>
                          <option value="CASH">دفع نقدي</option>
                          <option value="TRANSFER">تحويل بنكي</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">المبلغ المدفوع ($)</label>
                        <input
                          type="text"
                          value={posAmountPaid}
                          onChange={(e) => setPosAmountPaid(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-xs rounded-xl px-3 py-3 focus:outline-none text-slate-800 focus:border-indigo-500 text-left font-mono font-bold"
                          placeholder={`${calculateCartTotal().toFixed(2)}`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePOSCheckout}
                      className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-2xl text-sm tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] cursor-pointer text-center"
                    >
                      إعتماد وإصدار إيصال الفاتورة المبسطة
                    </button>
                  </div>
                </div>

                {/* PRINT INVOICE RECEIPT OVERLAY */}
                {posCheckoutSuccess && (
                  <div className="bg-white border border-emerald-500/30 p-6 rounded-[32px] space-y-4 shadow-xl text-right">
                    <div className="flex items-center gap-2 text-emerald-650 justify-end">
                      <CheckCircle className="w-6 h-6" />
                      <h4 className="font-extrabold text-sm md:text-base">تم حفظ الفاتورة وإتمام المعاملة بنجاح!</h4>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl font-mono text-xs space-y-2.5 border border-slate-200 text-right shadow-inner">
                      <p className="text-center font-bold text-sm text-slate-800">إيصال مبيعات مبسط</p>
                      <p className="text-center text-slate-500 font-mono mt-1">الفاتورة: {posCheckoutSuccess.invoiceNumber}</p>
                      <p className="text-center text-slate-400 font-mono">التاريخ: {new Date(posCheckoutSuccess.createdAt).toLocaleString("ar-SA")}</p>
                      <div className="border-t border-dashed border-slate-300 my-3"></div>
                      {posCheckoutSuccess.items?.map((it: any) => (
                        <div key={it.id} className="flex justify-between text-slate-700 font-sans text-right text-sm">
                          <span className="font-mono text-left font-bold">${(Number(it.unitPrice) * Number(it.quantity)).toFixed(2)}</span>
                          <span>{it.quantity}x {it.variant?.sku || "صنف منتج"}</span>
                        </div>
                      ))}
                      <div className="border-t border-dashed border-slate-300 my-3"></div>
                      <div className="flex justify-between text-slate-900 font-black text-sm">
                        <span className="font-mono text-left">${Number(posCheckoutSuccess.grandTotal).toFixed(2)}</span>
                        <span>المجموع (شامل الضريبة)</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span className="font-mono text-left">${Number(posCheckoutSuccess.amountPaid).toFixed(2)}</span>
                        <span>المبلغ المدفوع</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPosCheckoutSuccess(null)}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-250 text-slate-700 text-sm font-extrabold rounded-xl transition-all cursor-pointer"
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
                <h2 className="text-2xl font-black text-slate-900">سجل فواتير المبيعات الصادرة</h2>
                <p className="text-sm text-slate-500 mt-1">مراجعة وتتبع جميع الفواتير الصادرة للعملاء وتاريخ السداد الخاص بكل عملية</p>
              </div>

              {/* INVOICES TABLE */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                {invoices.length === 0 ? (
                  <p className="text-base text-slate-400 text-center py-24 font-bold">لا توجد فواتير مبيعات مسجلة حتى الآن.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4.5 font-extrabold">رقم الفاتورة والتاريخ</th>
                          <th className="px-6 py-4.5 font-extrabold">العميل المرتبط</th>
                          <th className="px-6 py-4.5 font-extrabold">طريقة الدفع</th>
                          <th className="px-6 py-4.5 font-extrabold text-left">قيمة الضريبة (15%)</th>
                          <th className="px-6 py-4.5 font-extrabold text-left">المجموع الكلي</th>
                          <th className="px-6 py-4.5 font-extrabold text-center">حالة السداد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3.5">
                              <span className="font-mono font-black text-slate-900 block text-base">{inv.invoiceNumber}</span>
                              <span className="text-xs text-slate-500 block mt-1 font-mono">
                                {new Date(inv.createdAt).toLocaleString("ar-SA")}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-800 font-extrabold">
                              {inv.customer?.name || "عميل نقدي عابر"}
                            </td>
                            <td className="px-6 py-3.5 text-slate-600 font-bold">
                              {inv.paymentMethod === "CARD" ? "مدى / بطاقة" : inv.paymentMethod === "CASH" ? "نقدي" : "تحويل بنكي"}
                            </td>
                            <td className="px-6 py-3.5 text-left font-mono text-slate-700 font-bold">${Number(inv.taxTotal).toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-left font-black text-slate-900 text-base font-mono">${Number(inv.grandTotal).toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                inv.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
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
                  <h2 className="text-xl font-black text-slate-900">إدارة مصروفات المنشأة والخزينة</h2>
                  <p className="text-sm text-slate-500 mt-1">تتبع التدفقات النقدية الخارجة، أجور الموظفين، تكاليف الإيجار وفواتير الخدمات العامة</p>
                </div>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-600/10 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Plus className="w-5 h-5" />
                  <span>تسجيل مصروف جديد</span>
                </button>
              </div>

              {/* EXPENSES LOG TABLE */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                {expenses.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-20 font-bold">لا توجد مصروفات مسجلة حتى الآن.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-4 font-extrabold">تاريخ الصرف</th>
                          <th className="px-5 py-4 font-extrabold">التصنيف</th>
                          <th className="px-5 py-4 font-extrabold">الوصف والبيان التفصيلي</th>
                          <th className="px-5 py-4 font-extrabold text-left">القيمة المالية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 text-slate-800 font-mono font-semibold">
                              {new Date(exp.expenseDate).toLocaleDateString("ar-SA")}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-block text-xs font-bold bg-rose-50 text-rose-600 px-3 py-1 rounded-lg">
                                {exp.category === "UTILITIES" ? "خدمات ومرافق" : 
                                 exp.category === "RENT" ? "إيجارات" : 
                                 exp.category === "MARKETING" ? "تسويق وإعلانات" : 
                                 exp.category === "SALARIES" ? "أجور ورواتب" : "شحن ولوجستيات"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-700 font-semibold leading-relaxed">{exp.description || "بدون بيان إضافي"}</td>
                            <td className="px-5 py-4 text-left font-black text-rose-600 text-base font-mono">${Number(exp.amount).toFixed(2)}</td>
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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAddCustomer(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right">تسجيل ملف عميل جديد (CRM)</h3>
                <form onSubmit={createCustomer} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الاسم الكامل / اسم الشركة</label>
                      <input
                        type="text"
                        required
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="شركة أحمد اللوجستية"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">رقم الهاتف</label>
                      <input
                        type="text"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-medium"
                        placeholder="+966500000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الرقم الضريبي</label>
                      <input
                        type="text"
                        value={newCustTax}
                        onChange={(e) => setNewCustTax(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none font-mono text-left font-medium"
                        placeholder="300012345600003"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الحد الائتماني ($)</label>
                      <input
                        type="number"
                        value={newCustLimit}
                        onChange={(e) => setNewCustLimit(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-mono font-medium"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">عنوان التوصيل والشحن</label>
                    <input
                      type="text"
                      value={newCustShipping}
                      onChange={(e) => setNewCustShipping(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="شارع العليا العام، الرياض، المملكة العربية السعودية"
                    />
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">عنوان الفوترة</label>
                    <input
                      type="text"
                      value={newCustBilling}
                      onChange={(e) => setNewCustBilling(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="نفس عنوان التوصيل الرئيسي"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg active:scale-[0.98]"
                  >
                    تأكيد تسجيل ملف العميل في النظام
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD PRODUCT MODAL */}
          {showAddProduct && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAddProduct(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right">إدراج منتج جديد في دليل المنشأة</h3>
                <form onSubmit={createProduct} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">اسم السلعة / المنتج</label>
                      <input
                        type="text"
                        required
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="شاشة كمبيوتر 4K"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">العلامة التجارية / الشركة المصنعة</label>
                      <input
                        type="text"
                        value={newProdBrand}
                        onChange={(e) => setNewProdBrand(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="سامسونج"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الوصف التفصيلي</label>
                    <textarea
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none h-20 resize-none text-right font-medium"
                      placeholder="اكتب تفاصيل ومواصفات المنتج هنا..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 border border-slate-200 rounded-2xl text-right">
                    <div className="col-span-2">
                      <h4 className="text-xs font-black text-indigo-600 mb-2 text-right">خصائص وتكلفة الصنف الأول للمنتج</h4>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 text-right">رمز SKU المخزني (فريد)</label>
                      <input
                        type="text"
                        required
                        value={newProdSKU}
                        onChange={(e) => setNewProdSKU(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none font-mono text-left font-bold"
                        placeholder="MON-4K-BLK"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 text-right">رمز الباركود (UPC/EAN)</label>
                      <input
                        type="text"
                        value={newProdBarcode}
                        onChange={(e) => setNewProdBarcode(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none font-mono text-left font-bold"
                        placeholder="8806090000000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 text-right">سعر البيع الافتراضي ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 text-right">تكلفة الشراء الأصلية ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newProdCost}
                        onChange={(e) => setNewProdCost(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <label className="block text-xs font-bold text-slate-700 mb-2 text-right">خاصية مميزة للمنتج (مثال: لون أو حجم)</label>
                      <input
                        type="text"
                        value={newProdColor}
                        onChange={(e) => setNewProdColor(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="أسود داكن"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg"
                  >
                    تأكيد إدراج المنتج في دليل المخزن
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD EXPENSE MODAL */}
          {showAddExpense && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAddExpense(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-rose-650 text-right">تقييد وقيد مصروفات المنشأة</h3>
                <form onSubmit={createExpense} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">المبلغ المالي ($)</label>
                      <input
                        type="number"
                        required
                        value={newExpAmount}
                        onChange={(e) => setNewExpAmount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">تصنيف المصروف</label>
                      <select
                        value={newExpCategory}
                        onChange={(e) => setNewExpCategory(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-3 text-sm text-slate-800 outline-none font-bold cursor-pointer text-right"
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
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">وصف وبيان الصرف</label>
                    <textarea
                      required
                      value={newExpDesc}
                      onChange={(e) => setNewExpDesc(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none h-24 resize-none text-right font-medium"
                      placeholder="اكتب هنا ما يوضح سبب صرف الميزانية..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg shadow-rose-600/10 active:scale-[0.98]"
                  >
                    قيد العملية وخصمها من الميزانية
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD WAREHOUSE MODAL */}
          {showAddWarehouse && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAddWarehouse(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right">إدراج مستودع / فرع لوجستي جديد</h3>
                <form onSubmit={createWarehouse} className="space-y-5">
                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">اسم المستودع / الفرع</label>
                    <input
                      type="text"
                      required
                      value={newWhName}
                      onChange={(e) => setNewWhName(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="مستودع المنطقة الوسطى الرئيسي"
                    />
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">العنوان الجغرافي بالتفصيل</label>
                    <input
                      type="text"
                      value={newWhAddress}
                      onChange={(e) => setNewWhAddress(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="المنطقة الصناعية الثانية، مخرج 15، الرياض"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg"
                  >
                    تأكيد قيد المستودع في النظام
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STOCK ADJUSTMENT / INGEST MODAL */}
          {showAdjustStock && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAdjustStock(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right">تسوية ورفع كميات المخزون المتوفرة</h3>
                <form onSubmit={adjustStock} className="space-y-5">
                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">المستودع / الفرع المستهدف</label>
                    <select
                      required
                      value={adjWarehouseId}
                      onChange={(e) => setAdjWarehouseId(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 py-2.5 text-sm text-slate-800 outline-none font-bold cursor-pointer text-right"
                    >
                      <option value="">اختر مستودع التخزين...</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الصنف والرمز المخزني المستهدف (SKU)</label>
                    <select
                      required
                      value={adjVariantId}
                      onChange={(e) => setAdjVariantId(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 py-2.5 text-sm text-slate-800 outline-none font-bold cursor-pointer text-right"
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
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الكمية الجديدة المراد إضافتها (وحدة)</label>
                    <input
                      type="number"
                      required
                      value={adjQty}
                      onChange={(e) => setAdjQty(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg"
                  >
                    تأكيد إدخال وتسوية الكميات في المستودع
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- FIRST TIME WELCOME MODAL --- */}
          {showWelcomeModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-lg p-8 relative animate-in fade-in zoom-in-95 duration-350 text-center shadow-2xl">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-3">
                  أهلاً بك في {tenantInfo?.businessName || regBusinessName}!
                </h3>
                
                <p className="text-slate-600 text-base font-medium leading-relaxed mb-6">
                  لقد تم بنجاح تأسيس نظامك الخاص ومساحة العمل السحابية لمنشأتك.
                  لقد قمنا بتهيئة إعدادات وتكوينات النظام لتلائم قطاع عملك المختار: 
                  <strong className="text-indigo-600 mx-1">
                    {getIndustryNameArabic(tenantInfo?.industryType || regIndustryType)}
                  </strong>.
                  <br />
                  يمكنك الآن البدء في تصفح سلة الكاشير (POS) أو إدراج المنتجات والعملاء.
                </p>

                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    setIsFirstTimeSetup(false);
                    // Save in local storage so it never shows again for this tenant subdomain
                    if (tenantInfo?.subdomain) {
                      localStorage.setItem(`onboarded_${tenantInfo.subdomain}`, "true");
                    }
                  }}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  ابدأ العمل الآن
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
