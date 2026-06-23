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
  ChevronRight,
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
      return "https://saas-ybcw.onrender.com";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
};

export default function Home() {
  const API_BASE_URL = getApiUrl();

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
        throw new Error(data.message || "Invalid credentials.");
      }
      localStorage.setItem("crm_access_token", data.accessToken);
      setToken(data.accessToken);
      decodeTenantFromToken(data.accessToken);
      showTemporarySuccess("Logged in successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed.");
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
        throw new Error(msg || "Registration failed.");
      }
      localStorage.setItem("crm_access_token", data.accessToken);
      setToken(data.accessToken);
      decodeTenantFromToken(data.accessToken);
      showTemporarySuccess("Tenant onboarded and logged in successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed.");
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
      setErrorMsg("Failed to sync context with server.");
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
      if (!res.ok) throw new Error(data.message || "Failed to create customer.");
      
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
      showTemporarySuccess(`Customer '${data.name}' registered.`);
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
      if (!res.ok) throw new Error(data.message || "Failed to register product catalog.");
      
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
      showTemporarySuccess(`Product '${data.name}' registered with variants.`);
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
      if (!res.ok) throw new Error(data.message || "Failed to create warehouse.");
      
      setWarehouses([...warehouses, data]);
      setShowAddWarehouse(false);
      setNewWhName("");
      setNewWhAddress("");
      showTemporarySuccess(`Warehouse '${data.name}' created.`);
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
      if (!res.ok) throw new Error(data.message || "Failed to adjust stock.");
      
      setShowAdjustStock(false);
      fetchAllData(); // reload products to show new stock balances
      showTemporarySuccess("Stock balance adjusted successfully.");
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
      if (!res.ok) throw new Error(data.message || "Failed to log expense.");
      
      setExpenses([data, ...expenses]);
      setShowAddExpense(false);
      setNewExpAmount(50);
      setNewExpDesc("");
      showTemporarySuccess("Operational expense logged.");
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
      setErrorMsg("Please select a warehouse.");
      return;
    }
    if (posCart.length === 0) {
      setErrorMsg("Your POS cart is empty.");
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
      if (!res.ok) throw new Error(data.message || "Checkout failed.");

      setPosCheckoutSuccess(data);
      setPosCart([]);
      setPosAmountPaid("");
      fetchAllData(); // refresh stock balances and lists
      showTemporarySuccess("POS Checkout completed successfully!");
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
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-6 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] pointer-events-none"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="flex justify-center items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Building className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-violet-400 bg-clip-text text-transparent">
              AntiGravity ERP
            </span>
          </div>
          <h2 className="mt-6 text-center text-xl font-medium text-slate-400">
            {authMode === "login" ? "Sign in to your organization workspace" : "Create a new multi-tenant SaaS workspace"}
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
            {errorMsg && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg flex items-start gap-2.5 text-sm animate-pulse">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg flex items-start gap-2.5 text-sm">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {authMode === "login" ? (
              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="mt-1.5 w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm transition-all focus:outline-none"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="mt-1.5 w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm transition-all focus:outline-none"
                    placeholder="••••••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {authLoading ? <Loader className="w-5 h-5 animate-spin" /> : "Sign In"}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">First Name</label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      className="mt-1 w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-white text-xs transition-all focus:outline-none"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Last Name</label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      className="mt-1 w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-white text-xs transition-all focus:outline-none"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="mt-1 w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-white text-xs transition-all focus:outline-none"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300">Password (Min 12 chars)</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="mt-1 w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-white text-xs transition-all focus:outline-none"
                    placeholder="••••••••••••"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Company Name</label>
                    <input
                      type="text"
                      required
                      value={regBusinessName}
                      onChange={(e) => setRegBusinessName(e.target.value)}
                      className="mt-1 w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-white text-xs transition-all focus:outline-none"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Subdomain</label>
                    <input
                      type="text"
                      required
                      value={regSubdomain}
                      onChange={(e) => setRegSubdomain(e.target.value)}
                      className="mt-1 w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-white text-xs transition-all focus:outline-none"
                      placeholder="acme"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Industry</label>
                    <select
                      value={regIndustryType}
                      onChange={(e) => setRegIndustryType(e.target.value)}
                      className="mt-1 w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2 py-2 text-white text-xs transition-all focus:outline-none"
                    >
                      <option value="RETAIL">Retail</option>
                      <option value="GARAGE">Garage Service</option>
                      <option value="TAILOR">Tailor Workshop</option>
                      <option value="WHOLESALE">Wholesale Trade</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Billing Plan</label>
                    <select
                      value={regPlanName}
                      onChange={(e) => setRegPlanName(e.target.value)}
                      className="mt-1 w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2 py-2 text-white text-xs transition-all focus:outline-none"
                    >
                      <option value="BUSINESS">Business (Recommended)</option>
                      <option value="STARTER">Starter Plan</option>
                      <option value="PROFESSIONAL">Professional</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {authLoading ? <Loader className="w-5 h-5 animate-spin" /> : "Onboard Workspace"}
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setErrorMsg(null);
                }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {authMode === "login" ? "Don't have a workspace? Create tenant" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD SCREEN ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* HEADERBAR */}
      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/60 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
              {tenantInfo?.businessName || "AntiGravity ERP"}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              <span>{tenantInfo?.subdomain}.crmsaas.app</span>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold text-[10px]">
                {tenantInfo?.roles?.join(", ") || "OWNER"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchAllData}
            disabled={dataLoading}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:bg-slate-800/50 rounded-lg text-xs font-medium transition-colors"
          >
            {dataLoading ? <Loader className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : "Sync Cloud DB"}
          </button>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-white">
              {tenantInfo?.email}
            </p>
            <p className="text-[10px] text-slate-400">Connected</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 rounded-lg transition-all"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* DASHBOARD BODY LAYOUT */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-64 bg-slate-900/20 border-b lg:border-b-0 lg:border-r border-slate-800/60 p-4 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === "dashboard"
                ? "bg-indigo-500/15 text-indigo-400 border-l-2 border-indigo-500"
                : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === "customers"
                ? "bg-indigo-500/15 text-indigo-400 border-l-2 border-indigo-500"
                : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>CRM Customers</span>
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === "products"
                ? "bg-indigo-500/15 text-indigo-400 border-l-2 border-indigo-500"
                : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Product Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === "pos"
                ? "bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-500"
                : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>POS Cashier</span>
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === "invoices"
                ? "bg-indigo-500/15 text-indigo-400 border-l-2 border-indigo-500"
                : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Sales Invoices</span>
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === "expenses"
                ? "bg-indigo-500/15 text-indigo-400 border-l-2 border-indigo-500"
                : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span>Expenses Finance</span>
          </button>
        </aside>

        {/* MAIN VIEW AREA */}
        <main className="flex-1 p-6 relative">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm relative">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Action Failed: </span>
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="absolute top-2 right-2.5 text-slate-500 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-start gap-3 text-sm">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Success: </span>
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* LOADING STATE COVER */}
          {dataLoading && customers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Syncing with live Supabase database instance...</p>
            </div>
          )}

          {/* TAB CONTENT: 1. DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* METRIC CARD GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700/80 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales</span>
                    <Coins className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">${totalSales.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-indigo-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Real-time POS checkout logs</span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700/80 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expenses</span>
                    <DollarSign className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">${totalExpenses.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                    <span>Operating & Utilities</span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700/80 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</span>
                    <Coins className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className={`text-2xl font-bold mt-2 ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    ${netProfit.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-400">
                    <span>Active margin balance</span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700/80 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Levels</span>
                    <Package className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{totalStockQty} Units</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-400">
                    <span>Across {warehouses.length} Warehouses</span>
                  </div>
                </div>
              </div>

              {/* SECONDARY INFO BLOCK: WAREHOUSES & RECENT ACTIVITY */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* WAREHOUSE REGISTRY SUMMARY */}
                <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl lg:col-span-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Warehouse className="w-4.5 h-4.5 text-indigo-400" />
                      <span>Physical Warehouses</span>
                    </h3>
                    <button
                      onClick={() => setShowAddWarehouse(true)}
                      className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white rounded-lg text-indigo-400 transition-all"
                      title="Add Warehouse"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {warehouses.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No warehouses registered. Create one to ingest inventory.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {warehouses.map((wh) => (
                        <div key={wh.id} className="bg-slate-950/60 border border-slate-800/40 p-3.5 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-white">{wh.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{wh.address || "No address provided"}</p>
                          </div>
                          <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
                            Active
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowAdjustStock(true)}
                    className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-xl transition-all"
                  >
                    Adjust / Ingest Stock Levels
                  </button>
                </div>

                {/* RECENT INVOICES CHECKOUT LOG */}
                <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-indigo-400" />
                      <span>Recent Sales Transactions</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab("invoices")}
                      className="text-xs font-semibold text-indigo-400 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {invoices.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-10">No checkout transactions recorded.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-2 font-medium">Invoice No.</th>
                            <th className="pb-2 font-medium">Customer</th>
                            <th className="pb-2 font-medium">Payment</th>
                            <th className="pb-2 font-medium text-right">Total</th>
                            <th className="pb-2 font-medium text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {invoices.slice(0, 4).map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-900/10 transition-colors">
                              <td className="py-2.5 font-mono text-slate-300">{inv.invoiceNumber}</td>
                              <td className="py-2.5 text-slate-300">{inv.customer?.name || "Cash Walk-in"}</td>
                              <td className="py-2.5 text-[10px] font-semibold text-slate-400">{inv.paymentMethod}</td>
                              <td className="py-2.5 text-right font-bold text-white">${Number(inv.grandTotal).toFixed(2)}</td>
                              <td className="py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                }`}>
                                  {inv.status}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">CRM Customers</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage customer directory accounts and credit balances</p>
                </div>
                <button
                  onClick={() => setShowAddCustomer(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Customer</span>
                </button>
              </div>

              {/* CUSTOMERS LISTING TABLE */}
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden">
                {customers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-20">No customer records. Click Register Customer to add.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/60 text-slate-300 border-b border-slate-800">
                        <tr>
                          <th className="px-5 py-3.5 font-semibold">Name</th>
                          <th className="px-5 py-3.5 font-semibold">Contact</th>
                          <th className="px-5 py-3.5 font-semibold">Tax Number</th>
                          <th className="px-5 py-3.5 font-semibold">Credit Limit</th>
                          <th className="px-5 py-3.5 font-semibold">Outstanding Bal.</th>
                          <th className="px-5 py-3.5 font-semibold">Registered Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {customers.map((cust) => (
                          <tr key={cust.id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="px-5 py-3.5">
                              <span className="font-semibold text-white text-sm">{cust.name}</span>
                              <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{cust.id}</span>
                            </td>
                            <td className="px-5 py-3.5 space-y-0.5">
                              <span className="block text-slate-300">{cust.email || "No email"}</span>
                              <span className="block text-slate-400 text-[10px]">{cust.phone || "No phone"}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-300">{cust.taxNumber || "—"}</td>
                            <td className="px-5 py-3.5 font-bold text-white">${Number(cust.creditLimit).toFixed(2)}</td>
                            <td className="px-5 py-3.5">
                              <span className={`font-bold ${Number(cust.outstandingBalance) > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                ${Number(cust.outstandingBalance).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-400">
                              {new Date(cust.createdAt).toLocaleDateString()}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Product Catalog</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage products, multi-attribute variants, and physical barcodes</p>
                </div>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all active:scale-[0.98]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register Product</span>
                </button>
              </div>

              {/* PRODUCTS LISTING */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {products.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-20 lg:col-span-2">No product records in catalog. Click Register Product.</p>
                ) : (
                  products.map((p) => (
                    <div key={p.id} className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 hover:border-slate-700/80 transition-all">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                            {p.brand || "Generics"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {p.id.slice(0, 8)}</span>
                        </div>
                        <h3 className="font-bold text-base text-white mt-1.5">{p.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{p.description || "No description provided."}</p>
                      </div>

                      {/* Variants and stock listing */}
                      <div className="border-t border-slate-800/60 pt-3 space-y-2.5">
                        <h4 className="text-xs font-semibold text-slate-300">Registered SKU Variants:</h4>
                        {p.variants?.map((v: any) => (
                          <div key={v.id} className="bg-slate-950/80 border border-slate-800/30 p-3 rounded-xl flex items-center justify-between text-xs gap-3">
                            <div className="space-y-1">
                              <p className="font-mono font-bold text-indigo-400">{v.sku}</p>
                              {v.barcode && (
                                <p className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                  <QrCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{v.barcode}</span>
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400">
                                {Object.keys(v.attributes || {}).map((k) => `${k}: ${v.attributes[k]}`).join(" | ")}
                              </p>
                            </div>

                            <div className="text-right shrink-0 space-y-1">
                              <p className="font-bold text-white">${Number(v.price).toFixed(2)}</p>
                              <p className="text-[9px] text-slate-500">Cost: ${Number(v.costPrice).toFixed(2)}</p>
                              <div className="mt-1">
                                {v.balances && v.balances.length > 0 ? (
                                  v.balances.map((bal: any) => (
                                    <span key={bal.id} className="inline-block text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                                      {bal.warehouse?.name || "Hub"}: {Number(bal.quantity)} units
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] text-rose-400 font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded">
                                    Out of stock
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
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* LEFT COLUMN: PRODUCTS BROWSER (3/5 width) */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-emerald-400" />
                      <span>POS Cashier Billing</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Select items to generate direct client invoices</p>
                  </div>

                  <div className="flex gap-2">
                    {/* Select Warehouse */}
                    <select
                      value={posWarehouseId}
                      onChange={(e) => setPosWarehouseId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none text-white focus:border-indigo-500"
                    >
                      <option value="">Select Warehouse...</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SEARCH PRODUCTS */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    value={posSearchQuery}
                    onChange={(e) => setPosSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Search product catalogs, variants, SKU, barcode..."
                  />
                </div>

                {/* PRODUCTS LIST */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
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
                            className={`bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500/50 transition-all ${
                              Number(stockBal) > 0 ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{p.brand}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  Number(stockBal) > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                }`}>
                                  {Number(stockBal) > 0 ? `Stock: ${Number(stockBal)}` : "Out of Stock"}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-white mt-1">{p.name}</h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {v.sku}</p>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800/40">
                              <span className="font-bold text-sm text-emerald-400">${Number(v.price).toFixed(2)}</span>
                              {Number(stockBal) > 0 && (
                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-colors">
                                  Add to cart
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                </div>
              </div>

              {/* RIGHT COLUMN: POS CHECKOUT CART (2/5 width) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col min-h-[550px] justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                      <span>Checkout Cart</span>
                      <span className="text-xs text-slate-400">{posCart.length} items</span>
                    </h3>

                    {/* SELECT CUSTOMER AND WAREHOUSE WARNING */}
                    <div className="space-y-2 mt-4">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Associate Customer (CRM)</label>
                        <select
                          value={posCustomerId}
                          onChange={(e) => setPosCustomerId(e.target.value)}
                          className="mt-1 w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Anonymous Walk-in Customer</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>{c.name} (${Number(c.outstandingBalance).toFixed(2)} bal)</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* CART LISTING */}
                    {posCart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs space-y-2">
                        <ShoppingCart className="w-8 h-8 text-slate-600" />
                        <p>No items in cart. Click products to add.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-4 max-h-[220px] overflow-y-auto pr-1">
                        {posCart.map((item) => (
                          <div key={item.variantId} className="bg-slate-950/60 border border-slate-800/40 p-2.5 rounded-xl flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-white text-xs truncate">{item.productName}</p>
                              <p className="font-mono text-[9px] text-indigo-400 mt-0.5">{item.sku}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                                className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-xs"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                                className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-xs"
                              >
                                +
                              </button>
                              <span className="font-bold text-white text-xs ml-2">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CHECKOUT TOTALS & BUTTON */}
                  <div className="border-t border-slate-800 pt-4 mt-4 space-y-3">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal</span>
                        <span>${calculateCartSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>VAT (15.00% VAT)</span>
                        <span>${calculateCartTax().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-slate-800/40">
                        <span>Grand Total</span>
                        <span>${calculateCartTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase tracking-wider">Payment</label>
                        <select
                          value={posPaymentMethod}
                          onChange={(e) => setPosPaymentMethod(e.target.value)}
                          className="mt-1 w-full bg-slate-950 border border-slate-800 text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none text-white focus:border-indigo-500"
                        >
                          <option value="CARD">Credit Card</option>
                          <option value="CASH">Cash Drawer</option>
                          <option value="TRANSFER">Bank Transfer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase tracking-wider">Amount Paid ($)</label>
                        <input
                          type="text"
                          value={posAmountPaid}
                          onChange={(e) => setPosAmountPaid(e.target.value)}
                          className="mt-1 w-full bg-slate-950 border border-slate-800 text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none text-white focus:border-indigo-500"
                          placeholder={`${calculateCartTotal().toFixed(2)}`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePOSCheckout}
                      className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
                    >
                      Process Transaction Checkout
                    </button>
                  </div>
                </div>

                {/* PRINT INVOICE RECEIPT OVERLAY */}
                {posCheckoutSuccess && (
                  <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      <h4 className="font-bold text-sm">Invoice Generated Successfully!</h4>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl font-mono text-[10px] space-y-2 border border-slate-800">
                      <p className="text-center font-bold text-xs text-white">RECEIPT</p>
                      <p className="text-center text-slate-400">Invoice: {posCheckoutSuccess.invoiceNumber}</p>
                      <p className="text-center text-slate-500">Date: {new Date(posCheckoutSuccess.createdAt).toLocaleString()}</p>
                      <div className="border-t border-dashed border-slate-800 my-2"></div>
                      {posCheckoutSuccess.items?.map((it: any) => (
                        <div key={it.id} className="flex justify-between text-slate-300">
                          <span>{it.quantity}x {it.variant?.sku || "Variant"}</span>
                          <span>${(Number(it.unitPrice) * Number(it.quantity)).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-dashed border-slate-800 my-2"></div>
                      <div className="flex justify-between text-white font-bold">
                        <span>Total (inc. VAT)</span>
                        <span>${Number(posCheckoutSuccess.grandTotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Amount Paid</span>
                        <span>${Number(posCheckoutSuccess.amountPaid).toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPosCheckoutSuccess(null)}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all"
                    >
                      Clear Receipt View
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 5. SALES INVOICES */}
          {activeTab === "invoices" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Sales Invoices</h2>
                <p className="text-xs text-slate-400 mt-0.5">Historical log of all generated POS and commercial billing invoices</p>
              </div>

              {/* INVOICES TABLE */}
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden">
                {invoices.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-20">No billing invoices have been generated yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/60 text-slate-300 border-b border-slate-800">
                        <tr>
                          <th className="px-5 py-3.5 font-semibold">Invoice No.</th>
                          <th className="px-5 py-3.5 font-semibold">Customer</th>
                          <th className="px-5 py-3.5 font-semibold">Billing Details</th>
                          <th className="px-5 py-3.5 font-semibold text-right">Tax (VAT)</th>
                          <th className="px-5 py-3.5 font-semibold text-right">Grand Total</th>
                          <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-white font-mono text-sm">{inv.invoiceNumber}</span>
                              <span className="block text-[10px] text-slate-500 mt-0.5">Date: {new Date(inv.createdAt).toLocaleString()}</span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-300 font-medium">
                              {inv.customer?.name || "Cash / Walk-in Client"}
                            </td>
                            <td className="px-5 py-3.5 space-y-0.5">
                              <p className="text-slate-400 text-[10px]">Payment: <span className="font-bold text-slate-300">{inv.paymentMethod}</span></p>
                              <p className="text-slate-400 text-[10px]">Amount Paid: <span className="font-bold text-slate-300">${Number(inv.amountPaid).toFixed(2)}</span></p>
                            </td>
                            <td className="px-5 py-3.5 text-right text-slate-300">${Number(inv.taxAmount).toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-right font-bold text-white text-sm">${Number(inv.grandTotal).toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                              }`}>
                                {inv.status}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Expenses Finance</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Track organization cash leaks, operational utility bills, and finance outflows</p>
                </div>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Expense</span>
                </button>
              </div>

              {/* EXPENSES LOG TABLE */}
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden">
                {expenses.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-20">No financial expenses recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/60 text-slate-300 border-b border-slate-800">
                        <tr>
                          <th className="px-5 py-3.5 font-semibold">Expense Date</th>
                          <th className="px-5 py-3.5 font-semibold">Category</th>
                          <th className="px-5 py-3.5 font-semibold">Description</th>
                          <th className="px-5 py-3.5 font-semibold text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="px-5 py-3.5 text-slate-300">
                              {new Date(exp.expenseDate).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-block text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded">
                                {exp.category}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-400">{exp.description || "—"}</td>
                            <td className="px-5 py-3.5 text-right font-bold text-rose-400 text-sm">${Number(exp.amount).toFixed(2)}</td>
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative">
                <button onClick={() => setShowAddCustomer(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                <h3 className="text-lg font-bold text-white mb-4">Register CRM Customer</h3>
                <form onSubmit={createCustomer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        placeholder="John Enterprise"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">Email</label>
                      <input
                        type="email"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">Phone</label>
                      <input
                        type="text"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        placeholder="+12345678"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">Tax Number</label>
                      <input
                        type="text"
                        value={newCustTax}
                        onChange={(e) => setNewCustTax(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        placeholder="VAT-123456"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">Credit Limit ($)</label>
                      <input
                        type="number"
                        value={newCustLimit}
                        onChange={(e) => setNewCustLimit(Number(e.target.value))}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300">Shipping Address</label>
                    <input
                      type="text"
                      value={newCustShipping}
                      onChange={(e) => setNewCustShipping(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      placeholder="123 Logistics St"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300">Billing Address</label>
                    <input
                      type="text"
                      value={newCustBilling}
                      onChange={(e) => setNewCustBilling(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      placeholder="456 Invoicing Blvd"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs transition-all"
                  >
                    Register CRM Profile
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD PRODUCT MODAL */}
          {showAddProduct && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative">
                <button onClick={() => setShowAddProduct(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                <h3 className="text-lg font-bold text-white mb-4">Register Product Catalog</h3>
                <form onSubmit={createProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">Product Name</label>
                      <input
                        type="text"
                        required
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        placeholder="MX Master 3S"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">Brand</label>
                      <input
                        type="text"
                        value={newProdBrand}
                        onChange={(e) => setNewProdBrand(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        placeholder="Logitech"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300">Description</label>
                    <textarea
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none h-16 resize-none"
                      placeholder="High performance office mouse..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3.5 border border-slate-800/60 rounded-xl">
                    <div className="col-span-2">
                      <h4 className="text-[10px] uppercase font-bold text-indigo-400">First Variant Attributes</h4>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">SKU Code (Unique)</label>
                      <input
                        type="text"
                        required
                        value={newProdSKU}
                        onChange={(e) => setNewProdSKU(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                        placeholder="MX-3S-BLK"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">UPC Barcode (Optional)</label>
                      <input
                        type="text"
                        value={newProdBarcode}
                        onChange={(e) => setNewProdBarcode(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                        placeholder="097855179043"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Selling Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Cost Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newProdCost}
                        onChange={(e) => setNewProdCost(Number(e.target.value))}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Attribute: Color</label>
                      <input
                        type="text"
                        value={newProdColor}
                        onChange={(e) => setNewProdColor(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs transition-all"
                  >
                    Commit Catalog Entry
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD EXPENSE MODAL */}
          {showAddExpense && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
                <button onClick={() => setShowAddExpense(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                <h3 className="text-lg font-bold text-white mb-4">Log Corporate Expense</h3>
                <form onSubmit={createExpense} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">Amount ($)</label>
                      <input
                        type="number"
                        required
                        value={newExpAmount}
                        onChange={(e) => setNewExpAmount(Number(e.target.value))}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">Category</label>
                      <select
                        value={newExpCategory}
                        onChange={(e) => setNewExpCategory(e.target.value)}
                        className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2 py-2 text-xs text-white outline-none"
                      >
                        <option value="UTILITIES">Utilities</option>
                        <option value="RENT">Rent & Lease</option>
                        <option value="MARKETING">Marketing & Ads</option>
                        <option value="SALARIES">Staff Salaries</option>
                        <option value="LOGISTICS">Logistics & Freight</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300">Expense Description</label>
                    <textarea
                      required
                      value={newExpDesc}
                      onChange={(e) => setNewExpDesc(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none h-20 resize-none"
                      placeholder="June warehouse electric power bill..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl text-xs transition-all"
                  >
                    Commit Outflow Transaction
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD WAREHOUSE MODAL */}
          {showAddWarehouse && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
                <button onClick={() => setShowAddWarehouse(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                <h3 className="text-lg font-bold text-white mb-4">Register Logistics Warehouse</h3>
                <form onSubmit={createWarehouse} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Warehouse Name</label>
                    <input
                      type="text"
                      required
                      value={newWhName}
                      onChange={(e) => setNewWhName(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      placeholder="Central Hub B"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300">Address / Location</label>
                    <input
                      type="text"
                      value={newWhAddress}
                      onChange={(e) => setNewWhAddress(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      placeholder="789 Industrial Rd, Gate 4"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs transition-all"
                  >
                    Create Warehouse Registry
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STOCK ADJUSTMENT / INGEST MODAL */}
          {showAdjustStock && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
                <button onClick={() => setShowAdjustStock(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                <h3 className="text-lg font-bold text-white mb-4">Ingest / Adjust Inventory Balance</h3>
                <form onSubmit={adjustStock} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Target Warehouse</label>
                    <select
                      required
                      value={adjWarehouseId}
                      onChange={(e) => setAdjWarehouseId(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 py-2 text-xs text-white outline-none"
                    >
                      <option value="">Select Target...</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300">Target Product Variant (SKU)</label>
                    <select
                      required
                      value={adjVariantId}
                      onChange={(e) => setAdjVariantId(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 py-2 text-xs text-white outline-none"
                    >
                      <option value="">Select Variant SKU...</option>
                      {products.map((p) =>
                        p.variants?.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {p.name} - SKU: {v.sku}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300">Adjust Quantity Level (units)</label>
                    <input
                      type="number"
                      required
                      value={adjQty}
                      onChange={(e) => setAdjQty(Number(e.target.value))}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs transition-all"
                  >
                    Commit Stock Adjustment
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
